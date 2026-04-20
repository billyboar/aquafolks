package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/service"
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/fasthttp/websocket"
	"github.com/gofiber/fiber/v2"
	fiberws "github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Client represents a WebSocket client connection
type Client struct {
	UserID uuid.UUID
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

// Hub maintains active client connections and broadcasts messages
type Hub struct {
	clients    map[uuid.UUID]*Client
	broadcast  chan *domain.WebSocketMessage
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uuid.UUID]*Client),
		broadcast:  make(chan *domain.WebSocketMessage, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("Client connected: %s", client.UserID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("Client disconnected: %s", client.UserID)

		case message := <-h.broadcast:
			// Send message to specific user or broadcast to all
			if msg, ok := message.Payload.(*domain.Message); ok {
				// Send to receiver
				h.sendToUser(msg.ReceiverID, message)
				// Also send to sender for confirmation
				h.sendToUser(msg.SenderID, message)
			}
		}
	}
}

// sendToUser sends a message to a specific user
func (h *Hub) sendToUser(userID uuid.UUID, message *domain.WebSocketMessage) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()

	if ok {
		data, err := json.Marshal(message)
		if err != nil {
			log.Printf("Error marshaling message: %v", err)
			return
		}

		select {
		case client.Send <- data:
		default:
			h.mu.Lock()
			close(client.Send)
			delete(h.clients, userID)
			h.mu.Unlock()
		}
	}
}

// SendTypingIndicator sends a typing indicator to a specific user
func (h *Hub) SendTypingIndicator(senderID, receiverID uuid.UUID, isTyping bool) {
	message := &domain.WebSocketMessage{
		Type: "typing",
		Payload: &domain.TypingIndicator{
			UserID:    senderID,
			IsTyping:  isTyping,
			Timestamp: time.Now(),
		},
	}

	h.sendToUser(receiverID, message)
}

// SendReadReceipt sends a read receipt to a specific user
func (h *Hub) SendReadReceipt(messageID, userID, receiverID uuid.UUID) {
	message := &domain.WebSocketMessage{
		Type: "read_receipt",
		Payload: &domain.ReadReceipt{
			MessageID: messageID,
			UserID:    userID,
			ReadAt:    time.Now(),
		},
	}

	h.sendToUser(receiverID, message)
}

// readPump pumps messages from the WebSocket connection to the hub
func (c *Client) readPump(messageService *service.MessageService, ctx context.Context) {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Parse incoming message
		var wsMsg domain.WebSocketMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("Error parsing message: %v", err)
			continue
		}

		// Handle different message types
		switch wsMsg.Type {
		case "message":
			// Handle new message
			var input domain.CreateMessageInput
			payloadBytes, err := json.Marshal(wsMsg.Payload)
			if err != nil {
				log.Printf("Error marshaling payload: %v", err)
				continue
			}

			if err := json.Unmarshal(payloadBytes, &input); err != nil {
				log.Printf("Error parsing message payload: %v", err)
				continue
			}

			// Create message via service
			msg, err := messageService.SendMessage(ctx, c.UserID, &input)
			if err != nil {
				// Send error back to sender
				errorMsg := &domain.WebSocketMessage{
					Type:    "error",
					Payload: map[string]string{"error": err.Error()},
				}
				errorData, _ := json.Marshal(errorMsg)
				c.Send <- errorData
				continue
			}

			// Broadcast the message
			c.Hub.broadcast <- &domain.WebSocketMessage{
				Type:    "message",
				Payload: msg,
			}

		case "typing":
			// Handle typing indicator
			var typing domain.TypingIndicator
			payloadBytes, err := json.Marshal(wsMsg.Payload)
			if err != nil {
				continue
			}

			if err := json.Unmarshal(payloadBytes, &typing); err != nil {
				continue
			}

			// Send typing indicator to the other user
			c.Hub.SendTypingIndicator(c.UserID, typing.UserID, typing.IsTyping)

		case "read_receipt":
			// Handle read receipt
			var receipt domain.ReadReceipt
			payloadBytes, err := json.Marshal(wsMsg.Payload)
			if err != nil {
				continue
			}

			if err := json.Unmarshal(payloadBytes, &receipt); err != nil {
				continue
			}

			// Mark message as read
			if err := messageService.MarkAsRead(ctx, receipt.MessageID, c.UserID); err != nil {
				log.Printf("Error marking message as read: %v", err)
				continue
			}

			// Send read receipt confirmation
			c.Hub.SendReadReceipt(receipt.MessageID, c.UserID, receipt.UserID)
		}
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub            *Hub
	messageService *service.MessageService
	jwtSecret      string
}

func NewWebSocketHandler(messageService *service.MessageService) *WebSocketHandler {
	hub := NewHub()
	go hub.Run() // Start the hub in a goroutine

	return &WebSocketHandler{
		hub:            hub,
		messageService: messageService,
	}
}

// RegisterRoutes registers WebSocket routes
func (h *WebSocketHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	h.jwtSecret = jwtSecret
	// WebSocket upgrade endpoint with JWT in query param
	app.Get("/ws", fiberws.New(h.HandleWebSocket, fiberws.Config{
		HandshakeTimeout: 10 * time.Second,
	}))
}

// HandleWebSocket handles WebSocket connections
func (h *WebSocketHandler) HandleWebSocket(c *fiberws.Conn) {
	// Get token from query parameter
	tokenString := c.Query("token")
	if tokenString == "" {
		log.Println("WebSocket: No token provided")
		c.Close()
		return
	}

	// Validate JWT token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		log.Printf("WebSocket: Invalid token: %v", err)
		c.Close()
		return
	}

	// Extract user ID from token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		log.Println("WebSocket: Invalid token claims")
		c.Close()
		return
	}

	userIDStr, ok := claims["sub"].(string)
	if !ok {
		userIDStr, ok = claims["user_id"].(string)
		if !ok {
			log.Println("WebSocket: No user_id in token")
			c.Close()
			return
		}
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		log.Printf("WebSocket: Invalid user ID: %v", err)
		c.Close()
		return
	}

	client := &Client{
		UserID: userID,
		Conn:   c.Conn, // Get the underlying websocket.Conn
		Send:   make(chan []byte, 256),
		Hub:    h.hub,
	}

	h.hub.register <- client

	// Start pumps
	go client.writePump()
	client.readPump(h.messageService, context.Background())
}
