package postgres

import (
	"aquabook/internal/domain"
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NotificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(ctx context.Context, input *domain.CreateNotificationInput) (*domain.Notification, error) {
	notification := &domain.Notification{}

	query := `
		INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, title, message, link)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, actor_id, type, entity_type, entity_id, title, message, link, is_read, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		input.UserID,
		input.ActorID,
		input.Type,
		input.EntityType,
		input.EntityID,
		input.Title,
		input.Message,
		input.Link,
	).Scan(
		&notification.ID,
		&notification.UserID,
		&notification.ActorID,
		&notification.Type,
		&notification.EntityType,
		&notification.EntityID,
		&notification.Title,
		&notification.Message,
		&notification.Link,
		&notification.IsRead,
		&notification.CreatedAt,
		&notification.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return notification, nil
}

func (r *NotificationRepository) GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Notification, error) {
	query := `
		SELECT 
			n.id, n.user_id, n.actor_id, n.type, n.entity_type, n.entity_id,
			n.title, n.message, n.link, n.is_read, n.created_at, n.updated_at,
			COALESCE(u.id, '00000000-0000-0000-0000-000000000000'::uuid),
			COALESCE(u.username, ''),
			COALESCE(u.email, ''),
			COALESCE(u.display_name, ''),
			COALESCE(u.avatar_url, ''),
			COALESCE(u.bio, ''),
			COALESCE(u.created_at, NOW()),
			COALESCE(u.updated_at, NOW())
		FROM notifications n
		LEFT JOIN users u ON n.actor_id = u.id
		WHERE n.user_id = $1
		ORDER BY n.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []domain.Notification
	for rows.Next() {
		var n domain.Notification
		var actor domain.User
		var actorID uuid.UUID

		err := rows.Scan(
			&n.ID, &n.UserID, &n.ActorID, &n.Type, &n.EntityType, &n.EntityID,
			&n.Title, &n.Message, &n.Link, &n.IsRead, &n.CreatedAt, &n.UpdatedAt,
			&actorID, &actor.Username, &actor.Email, &actor.DisplayName, &actor.AvatarURL, &actor.Bio,
			&actor.CreatedAt, &actor.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if n.ActorID != nil {
			actor.ID = actorID
			n.Actor = &actor
		}

		notifications = append(notifications, n)
	}

	return notifications, nil
}

func (r *NotificationRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	query := `SELECT get_unread_notification_count($1)`
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

func (r *NotificationRepository) MarkAsRead(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	query := `UPDATE notifications SET is_read = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, notificationID, userID)
	return err
}

func (r *NotificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE notifications SET is_read = TRUE, updated_at = NOW() WHERE user_id = $1 AND is_read = FALSE`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *NotificationRepository) Delete(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	query := `DELETE FROM notifications WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, notificationID, userID)
	return err
}

// Project Subscriptions

func (r *NotificationRepository) CreateProjectSubscription(ctx context.Context, userID, projectID uuid.UUID) (*domain.ProjectSubscription, error) {
	subscription := &domain.ProjectSubscription{}

	// First try to insert
	query := `
		INSERT INTO project_subscriptions (user_id, project_id)
		VALUES ($1, $2)
		RETURNING id, user_id, project_id, created_at
	`

	err := r.db.QueryRow(ctx, query, userID, projectID).Scan(
		&subscription.ID,
		&subscription.UserID,
		&subscription.ProjectID,
		&subscription.CreatedAt,
	)

	// If it already exists (unique constraint violation), fetch the existing one
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // unique_violation
			selectQuery := `
				SELECT id, user_id, project_id, created_at 
				FROM project_subscriptions 
				WHERE user_id = $1 AND project_id = $2
			`
			err = r.db.QueryRow(ctx, selectQuery, userID, projectID).Scan(
				&subscription.ID,
				&subscription.UserID,
				&subscription.ProjectID,
				&subscription.CreatedAt,
			)
		}
	}

	if err != nil {
		return nil, err
	}

	return subscription, nil
}

func (r *NotificationRepository) DeleteProjectSubscription(ctx context.Context, userID, projectID uuid.UUID) error {
	query := `DELETE FROM project_subscriptions WHERE user_id = $1 AND project_id = $2`
	_, err := r.db.Exec(ctx, query, userID, projectID)
	return err
}

func (r *NotificationRepository) IsSubscribedToProject(ctx context.Context, userID, projectID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM project_subscriptions WHERE user_id = $1 AND project_id = $2)`
	err := r.db.QueryRow(ctx, query, userID, projectID).Scan(&exists)
	return exists, err
}

func (r *NotificationRepository) GetProjectSubscribers(ctx context.Context, projectID uuid.UUID) ([]uuid.UUID, error) {
	query := `SELECT user_id FROM project_subscriptions WHERE project_id = $1`
	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subscribers []uuid.UUID
	for rows.Next() {
		var userID uuid.UUID
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		subscribers = append(subscribers, userID)
	}

	return subscribers, nil
}

// User Follows

func (r *NotificationRepository) CreateUserFollow(ctx context.Context, followerID, followingID uuid.UUID) (*domain.UserFollow, error) {
	follow := &domain.UserFollow{}

	query := `
		INSERT INTO user_follows (follower_id, following_id)
		VALUES ($1, $2)
		ON CONFLICT (follower_id, following_id) DO NOTHING
		RETURNING id, follower_id, following_id, created_at
	`

	err := r.db.QueryRow(ctx, query, followerID, followingID).Scan(
		&follow.ID,
		&follow.FollowerID,
		&follow.FollowingID,
		&follow.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return follow, nil
}

func (r *NotificationRepository) DeleteUserFollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	query := `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`
	_, err := r.db.Exec(ctx, query, followerID, followingID)
	return err
}

func (r *NotificationRepository) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2)`
	err := r.db.QueryRow(ctx, query, followerID, followingID).Scan(&exists)
	return exists, err
}

func (r *NotificationRepository) GetFollowers(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	query := `SELECT follower_id FROM user_follows WHERE following_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []uuid.UUID
	for rows.Next() {
		var followerID uuid.UUID
		if err := rows.Scan(&followerID); err != nil {
			return nil, err
		}
		followers = append(followers, followerID)
	}

	return followers, nil
}

func (r *NotificationRepository) GetFollowing(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	query := `SELECT following_id FROM user_follows WHERE follower_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []uuid.UUID
	for rows.Next() {
		var followingID uuid.UUID
		if err := rows.Scan(&followingID); err != nil {
			return nil, err
		}
		following = append(following, followingID)
	}

	return following, nil
}

// Notification Preferences

func (r *NotificationRepository) GetNotificationPreferences(ctx context.Context, userID uuid.UUID) (*domain.NotificationPreferences, error) {
	var prefsJSON []byte
	query := `SELECT notification_preferences FROM users WHERE id = $1`
	err := r.db.QueryRow(ctx, query, userID).Scan(&prefsJSON)
	if err != nil {
		return nil, err
	}

	var prefs domain.NotificationPreferences
	if err := json.Unmarshal(prefsJSON, &prefs); err != nil {
		return nil, err
	}

	return &prefs, nil
}

func (r *NotificationRepository) UpdateNotificationPreferences(ctx context.Context, userID uuid.UUID, prefs *domain.NotificationPreferences) error {
	prefsJSON, err := json.Marshal(prefs)
	if err != nil {
		return err
	}

	query := `UPDATE users SET notification_preferences = $1, updated_at = NOW() WHERE id = $2`
	_, err = r.db.Exec(ctx, query, prefsJSON, userID)
	return err
}
