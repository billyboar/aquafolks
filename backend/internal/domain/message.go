package domain

import (
	"time"

	"github.com/google/uuid"
)

// Message represents a direct message between two users
type Message struct {
	ID         uuid.UUID `json:"id" db:"id"`
	SenderID   uuid.UUID `json:"sender_id" db:"sender_id"`
	ReceiverID uuid.UUID `json:"receiver_id" db:"receiver_id"`
	Content    string    `json:"content" db:"content"`
	IsRead     bool      `json:"is_read" db:"is_read"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`

	// Populated from joins
	Sender   *User `json:"sender,omitempty" db:"-"`
	Receiver *User `json:"receiver,omitempty" db:"-"`
}

// Conversation represents a conversation between two users
type Conversation struct {
	User1ID       uuid.UUID `json:"user1_id" db:"user1_id"`
	User2ID       uuid.UUID `json:"user2_id" db:"user2_id"`
	LastMessage   string    `json:"last_message" db:"last_message"`
	LastMessageAt time.Time `json:"last_message_at" db:"last_message_at"`
	LastSenderID  uuid.UUID `json:"last_sender_id" db:"last_sender_id"`
	IsRead        bool      `json:"is_read" db:"is_read"`
	UnreadCount   int       `json:"unread_count" db:"unread_count"`

	// Populated from joins
	OtherUser *User `json:"other_user,omitempty" db:"-"`
}

// CreateMessageInput is the input for creating a new message
type CreateMessageInput struct {
	ReceiverID uuid.UUID `json:"receiver_id" validate:"required"`
	Content    string    `json:"content" validate:"required,min=1,max=10000"`
}

// WebSocketMessage represents a message sent over WebSocket
type WebSocketMessage struct {
	Type    string      `json:"type"` // "message", "read_receipt", "typing", "error"
	Payload interface{} `json:"payload"`
}

// TypingIndicator represents a typing indicator
type TypingIndicator struct {
	UserID    uuid.UUID `json:"user_id"`
	IsTyping  bool      `json:"is_typing"`
	Timestamp time.Time `json:"timestamp"`
}

// ReadReceipt represents a message read receipt
type ReadReceipt struct {
	MessageID uuid.UUID `json:"message_id"`
	UserID    uuid.UUID `json:"user_id"`
	ReadAt    time.Time `json:"read_at"`
}
