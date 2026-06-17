package postgres

import (
	"aquabook/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MessageRepository struct {
	db *pgxpool.Pool
}

func NewMessageRepository(db *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{db: db}
}

// Create creates a new message
func (r *MessageRepository) Create(ctx context.Context, message *domain.Message) error {
	query := `
		INSERT INTO messages (sender_id, recipient_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		message.SenderID,
		message.ReceiverID,
		message.Content,
	).Scan(
		&message.ID,
		&message.CreatedAt,
		&message.UpdatedAt,
	)
	if err == nil {
		message.IsRead = false
	}

	return err
}

// GetByID retrieves a message by ID
func (r *MessageRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Message, error) {
	query := `
		SELECT id, sender_id, recipient_id, content, (read_at IS NOT NULL) as is_read, created_at, updated_at
		FROM messages
		WHERE id = $1 AND deleted_at IS NULL
	`

	var message domain.Message
	err := r.db.QueryRow(ctx, query, id).Scan(
		&message.ID,
		&message.SenderID,
		&message.ReceiverID,
		&message.Content,
		&message.IsRead,
		&message.CreatedAt,
		&message.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &message, nil
}

// GetConversation retrieves all messages between two users
func (r *MessageRepository) GetConversation(ctx context.Context, user1ID, user2ID uuid.UUID, limit, offset int) ([]*domain.Message, error) {
	query := `
		SELECT id, sender_id, recipient_id, content, (read_at IS NOT NULL) as is_read, created_at, updated_at
		FROM messages
		WHERE ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))
		  AND deleted_at IS NULL
		ORDER BY created_at ASC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.Query(ctx, query, user1ID, user2ID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := make([]*domain.Message, 0)
	for rows.Next() {
		var message domain.Message
		err := rows.Scan(
			&message.ID,
			&message.SenderID,
			&message.ReceiverID,
			&message.Content,
			&message.IsRead,
			&message.CreatedAt,
			&message.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, &message)
	}

	return messages, nil
}

// GetConversations retrieves all conversations for a user
func (r *MessageRepository) GetConversations(ctx context.Context, userID uuid.UUID) ([]*domain.Conversation, error) {
	query := `
		WITH user_conversations AS (
			SELECT 
				CASE 
					WHEN sender_id = $1 THEN recipient_id
					ELSE sender_id
				END AS other_user_id,
				MAX(created_at) AS last_message_at
			FROM messages
			WHERE (sender_id = $1 OR recipient_id = $1) AND deleted_at IS NULL
			GROUP BY other_user_id
		),
		latest_messages AS (
			SELECT DISTINCT ON (uc.other_user_id)
				uc.other_user_id,
				m.id,
				m.sender_id,
				m.recipient_id,
				m.content AS last_message,
				(m.read_at IS NOT NULL) as is_read,
				m.created_at AS last_message_at
			FROM user_conversations uc
			JOIN messages m ON (
				(m.sender_id = $1 AND m.recipient_id = uc.other_user_id) OR
				(m.sender_id = uc.other_user_id AND m.recipient_id = $1)
			)
			WHERE m.deleted_at IS NULL
			ORDER BY uc.other_user_id, m.created_at DESC
		),
		unread_counts AS (
			SELECT 
				sender_id AS other_user_id,
				COUNT(*) AS unread_count
			FROM messages
			WHERE recipient_id = $1 AND read_at IS NULL AND deleted_at IS NULL
			GROUP BY sender_id
		)
		SELECT 
			lm.other_user_id,
			lm.last_message,
			lm.last_message_at,
			lm.sender_id AS last_sender_id,
			lm.is_read,
			COALESCE(uc.unread_count, 0) AS unread_count
		FROM latest_messages lm
		LEFT JOIN unread_counts uc ON lm.other_user_id = uc.other_user_id
		ORDER BY lm.last_message_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	conversations := make([]*domain.Conversation, 0)
	for rows.Next() {
		var conv domain.Conversation
		var otherUserID uuid.UUID

		err := rows.Scan(
			&otherUserID,
			&conv.LastMessage,
			&conv.LastMessageAt,
			&conv.LastSenderID,
			&conv.IsRead,
			&conv.UnreadCount,
		)
		if err != nil {
			return nil, err
		}

		// Set user1 and user2 based on userID
		if userID.String() < otherUserID.String() {
			conv.User1ID = userID
			conv.User2ID = otherUserID
		} else {
			conv.User1ID = otherUserID
			conv.User2ID = userID
		}

		conversations = append(conversations, &conv)
	}

	return conversations, nil
}

// MarkAsRead marks a message as read
func (r *MessageRepository) MarkAsRead(ctx context.Context, messageID uuid.UUID) error {
	query := `
		UPDATE messages
		SET read_at = NOW()
		WHERE id = $1 AND read_at IS NULL
	`

	_, err := r.db.Exec(ctx, query, messageID)
	return err
}

// MarkConversationAsRead marks all messages in a conversation as read
func (r *MessageRepository) MarkConversationAsRead(ctx context.Context, userID, otherUserID uuid.UUID) error {
	query := `
		UPDATE messages
		SET read_at = NOW()
		WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL
	`

	_, err := r.db.Exec(ctx, query, userID, otherUserID)
	return err
}

// GetUnreadCount gets the count of unread messages for a user
func (r *MessageRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM messages
		WHERE recipient_id = $1 AND read_at IS NULL AND deleted_at IS NULL
	`

	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// Delete deletes a message (soft delete by setting content to "deleted")
func (r *MessageRepository) Delete(ctx context.Context, messageID, userID uuid.UUID) error {
	// Only the sender can delete their own messages
	query := `
		UPDATE messages
		SET content = '[Message deleted]', deleted_at = NOW()
		WHERE id = $1 AND sender_id = $2
	`

	result, err := r.db.Exec(ctx, query, messageID, userID)
	if err != nil {
		return err
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("message not found or you don't have permission to delete it")
	}

	return nil
}

// Search searches messages by content
func (r *MessageRepository) Search(ctx context.Context, userID uuid.UUID, query string, limit int) ([]*domain.Message, error) {
	searchQuery := `
		SELECT id, sender_id, recipient_id, content, (read_at IS NOT NULL) as is_read, created_at, updated_at
		FROM messages
		WHERE (sender_id = $1 OR recipient_id = $1)
		  AND content ILIKE $2
		  AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $3
	`

	rows, err := r.db.Query(ctx, searchQuery, userID, "%"+query+"%", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := make([]*domain.Message, 0)
	for rows.Next() {
		var message domain.Message
		err := rows.Scan(
			&message.ID,
			&message.SenderID,
			&message.ReceiverID,
			&message.Content,
			&message.IsRead,
			&message.CreatedAt,
			&message.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, &message)
	}

	return messages, nil
}
