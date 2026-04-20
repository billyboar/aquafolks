package service

import (
	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type MessageService struct {
	messageRepo *postgres.MessageRepository
	userRepo    *postgres.UserRepository
}

func NewMessageService(messageRepo *postgres.MessageRepository, userRepo *postgres.UserRepository) *MessageService {
	return &MessageService{
		messageRepo: messageRepo,
		userRepo:    userRepo,
	}
}

// SendMessage sends a new message
func (s *MessageService) SendMessage(ctx context.Context, senderID uuid.UUID, input *domain.CreateMessageInput) (*domain.Message, error) {
	// Validate that sender is not sending to themselves
	if senderID == input.ReceiverID {
		return nil, fmt.Errorf("cannot send message to yourself")
	}

	// Check if receiver exists
	receiver, err := s.userRepo.GetByID(ctx, input.ReceiverID)
	if err != nil {
		return nil, fmt.Errorf("receiver not found")
	}

	// Create message
	message := &domain.Message{
		SenderID:   senderID,
		ReceiverID: input.ReceiverID,
		Content:    input.Content,
	}

	if err := s.messageRepo.Create(ctx, message); err != nil {
		return nil, err
	}

	// Load sender and receiver info
	sender, err := s.userRepo.GetByID(ctx, senderID)
	if err == nil {
		message.Sender = sender
	}
	message.Receiver = receiver

	return message, nil
}

// GetMessage retrieves a message by ID
func (s *MessageService) GetMessage(ctx context.Context, messageID, userID uuid.UUID) (*domain.Message, error) {
	message, err := s.messageRepo.GetByID(ctx, messageID)
	if err != nil {
		return nil, err
	}

	// Ensure the user is part of this message
	if message.SenderID != userID && message.ReceiverID != userID {
		return nil, fmt.Errorf("unauthorized to view this message")
	}

	// Load sender and receiver info
	sender, err := s.userRepo.GetByID(ctx, message.SenderID)
	if err == nil {
		message.Sender = sender
	}

	receiver, err := s.userRepo.GetByID(ctx, message.ReceiverID)
	if err == nil {
		message.Receiver = receiver
	}

	return message, nil
}

// GetConversation retrieves all messages between two users
func (s *MessageService) GetConversation(ctx context.Context, userID, otherUserID uuid.UUID, limit, offset int) ([]*domain.Message, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	messages, err := s.messageRepo.GetConversation(ctx, userID, otherUserID, limit, offset)
	if err != nil {
		return nil, err
	}

	// Load user info for all messages
	for _, message := range messages {
		sender, err := s.userRepo.GetByID(ctx, message.SenderID)
		if err == nil {
			message.Sender = sender
		}

		receiver, err := s.userRepo.GetByID(ctx, message.ReceiverID)
		if err == nil {
			message.Receiver = receiver
		}
	}

	return messages, nil
}

// GetConversations retrieves all conversations for a user
func (s *MessageService) GetConversations(ctx context.Context, userID uuid.UUID) ([]*domain.Conversation, error) {
	conversations, err := s.messageRepo.GetConversations(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Load other user info for each conversation
	for _, conv := range conversations {
		// Determine which is the other user
		otherUserID := conv.User1ID
		if conv.User1ID == userID {
			otherUserID = conv.User2ID
		}

		otherUser, err := s.userRepo.GetByID(ctx, otherUserID)
		if err == nil {
			conv.OtherUser = otherUser
		}
	}

	return conversations, nil
}

// MarkAsRead marks a message as read
func (s *MessageService) MarkAsRead(ctx context.Context, messageID, userID uuid.UUID) error {
	// First check if user is the receiver
	message, err := s.messageRepo.GetByID(ctx, messageID)
	if err != nil {
		return err
	}

	if message.ReceiverID != userID {
		return fmt.Errorf("unauthorized to mark this message as read")
	}

	return s.messageRepo.MarkAsRead(ctx, messageID)
}

// MarkConversationAsRead marks all messages in a conversation as read
func (s *MessageService) MarkConversationAsRead(ctx context.Context, userID, otherUserID uuid.UUID) error {
	return s.messageRepo.MarkConversationAsRead(ctx, userID, otherUserID)
}

// GetUnreadCount gets the count of unread messages for a user
func (s *MessageService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.messageRepo.GetUnreadCount(ctx, userID)
}

// DeleteMessage deletes a message
func (s *MessageService) DeleteMessage(ctx context.Context, messageID, userID uuid.UUID) error {
	return s.messageRepo.Delete(ctx, messageID, userID)
}

// SearchMessages searches messages by content
func (s *MessageService) SearchMessages(ctx context.Context, userID uuid.UUID, query string, limit int) ([]*domain.Message, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	return s.messageRepo.Search(ctx, userID, query, limit)
}
