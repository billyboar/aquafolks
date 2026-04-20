package domain

import (
	"time"

	"github.com/google/uuid"
)

type NotificationType string

const (
	NotificationTypeComment       NotificationType = "comment"
	NotificationTypeLike          NotificationType = "like"
	NotificationTypeFollow        NotificationType = "follow"
	NotificationTypeMessage       NotificationType = "message"
	NotificationTypeMarketplace   NotificationType = "marketplace"
	NotificationTypeProjectUpdate NotificationType = "project_update"
)

type EntityType string

const (
	EntityTypeTank    EntityType = "tank"
	EntityTypeProject EntityType = "project"
	EntityTypeListing EntityType = "listing"
	EntityTypeMessage EntityType = "message"
	EntityTypeComment EntityType = "comment"
)

type Notification struct {
	ID         uuid.UUID        `json:"id"`
	UserID     uuid.UUID        `json:"user_id"`
	ActorID    *uuid.UUID       `json:"actor_id"`
	Type       NotificationType `json:"type"`
	EntityType *EntityType      `json:"entity_type"`
	EntityID   *uuid.UUID       `json:"entity_id"`
	Title      string           `json:"title"`
	Message    string           `json:"message"`
	Link       string           `json:"link"`
	IsRead     bool             `json:"is_read"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`

	// Relationships
	Actor *User `json:"actor,omitempty"`
}

type CreateNotificationInput struct {
	UserID     uuid.UUID        `json:"user_id" validate:"required"`
	ActorID    *uuid.UUID       `json:"actor_id"`
	Type       NotificationType `json:"type" validate:"required"`
	EntityType *EntityType      `json:"entity_type"`
	EntityID   *uuid.UUID       `json:"entity_id"`
	Title      string           `json:"title" validate:"required"`
	Message    string           `json:"message"`
	Link       string           `json:"link"`
}

type ProjectSubscription struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	ProjectID uuid.UUID `json:"project_id"`
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	User    *User    `json:"user,omitempty"`
	Project *Project `json:"project,omitempty"`
}

type UserFollow struct {
	ID          uuid.UUID `json:"id"`
	FollowerID  uuid.UUID `json:"follower_id"`
	FollowingID uuid.UUID `json:"following_id"`
	CreatedAt   time.Time `json:"created_at"`

	// Relationships
	Follower  *User `json:"follower,omitempty"`
	Following *User `json:"following,omitempty"`
}

type NotificationPreferences struct {
	EmailComments       bool `json:"email_comments"`
	EmailLikes          bool `json:"email_likes"`
	EmailFollows        bool `json:"email_follows"`
	EmailMessages       bool `json:"email_messages"`
	EmailMarketplace    bool `json:"email_marketplace"`
	EmailProjectUpdates bool `json:"email_project_updates"`
	PushEnabled         bool `json:"push_enabled"`
}
