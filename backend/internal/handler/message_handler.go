package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MessageHandler struct {
	messageService *service.MessageService
}

func NewMessageHandler(messageService *service.MessageService) *MessageHandler {
	return &MessageHandler{messageService: messageService}
}

// RegisterRoutes registers all message routes
func (h *MessageHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	messages := app.Group("/api/v1/messages", middleware.JWTMiddleware(jwtSecret))

	messages.Get("/conversations", h.GetConversations)                // Get all conversations
	messages.Get("/conversations/:id", h.GetConversation)             // Get conversation with a user
	messages.Get("/unread-count", h.GetUnreadCount)                   // Get unread message count
	messages.Get("/search", h.SearchMessages)                         // Search messages
	messages.Post("/", h.SendMessage)                                 // Send a message
	messages.Put("/:id/read", h.MarkAsRead)                           // Mark message as read
	messages.Put("/conversations/:id/read", h.MarkConversationAsRead) // Mark conversation as read
	messages.Delete("/:id", h.DeleteMessage)                          // Delete a message
}

// GetConversations godoc
// @Summary Get all conversations
// @Description Get all conversations for the authenticated user
// @Tags messages
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages [get]
func (h *MessageHandler) GetConversations(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	conversations, err := h.messageService.GetConversations(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"conversations": conversations,
	})
}

// GetConversation godoc
// @Summary Get conversation with a user
// @Description Get all messages in a conversation with a specific user
// @Tags messages
// @Produce json
// @Param id path string true "Other User ID"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages/{id} [get]
func (h *MessageHandler) GetConversation(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	otherUserIDStr := c.Params("id")
	otherUserID, err := uuid.Parse(otherUserIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	limit := c.QueryInt("limit", 50)
	offset := c.QueryInt("offset", 0)

	messages, err := h.messageService.GetConversation(c.Context(), userID, otherUserID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"messages": messages,
	})
}

// SendMessage godoc
// @Summary Send a message
// @Description Send a new message to a user
// @Tags messages
// @Accept json
// @Produce json
// @Param message body domain.CreateMessageInput true "Message"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages [post]
func (h *MessageHandler) SendMessage(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	var input domain.CreateMessageInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	message, err := h.messageService.SendMessage(c.Context(), userID, &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": message,
	})
}

// MarkAsRead godoc
// @Summary Mark message as read
// @Description Mark a specific message as read
// @Tags messages
// @Produce json
// @Param id path string true "Message ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages/{id}/read [put]
func (h *MessageHandler) MarkAsRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	messageIDStr := c.Params("id")
	messageID, err := uuid.Parse(messageIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid message ID",
		})
	}

	if err := h.messageService.MarkAsRead(c.Context(), messageID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "message marked as read",
	})
}

// MarkConversationAsRead godoc
// @Summary Mark conversation as read
// @Description Mark all messages in a conversation as read
// @Tags messages
// @Produce json
// @Param id path string true "Other User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages/conversation/{id}/read [put]
func (h *MessageHandler) MarkConversationAsRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	otherUserIDStr := c.Params("id")
	otherUserID, err := uuid.Parse(otherUserIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	if err := h.messageService.MarkConversationAsRead(c.Context(), userID, otherUserID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "conversation marked as read",
	})
}

// GetUnreadCount godoc
// @Summary Get unread message count
// @Description Get the count of unread messages for the authenticated user
// @Tags messages
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages/unread-count [get]
func (h *MessageHandler) GetUnreadCount(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	count, err := h.messageService.GetUnreadCount(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"unread_count": count,
	})
}

// DeleteMessage godoc
// @Summary Delete a message
// @Description Delete a message (sender only)
// @Tags messages
// @Produce json
// @Param id path string true "Message ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages/{id} [delete]
func (h *MessageHandler) DeleteMessage(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	messageIDStr := c.Params("id")
	messageID, err := uuid.Parse(messageIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid message ID",
		})
	}

	if err := h.messageService.DeleteMessage(c.Context(), messageID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "message deleted",
	})
}

// SearchMessages godoc
// @Summary Search messages
// @Description Search messages by content
// @Tags messages
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Limit"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /messages/search [get]
func (h *MessageHandler) SearchMessages(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	query := c.Query("q")
	if query == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "query parameter 'q' is required",
		})
	}

	limitStr := c.Query("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	messages, err := h.messageService.SearchMessages(c.Context(), userID, query, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"messages": messages,
	})
}
