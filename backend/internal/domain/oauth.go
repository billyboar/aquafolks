package domain

import (
	"time"

	"github.com/google/uuid"
)

type OAuthAccount struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	Provider   string    `json:"provider"`    // 'google', 'facebook', 'apple'
	ProviderID string    `json:"provider_id"` // provider's unique user id
	Email      *string   `json:"email,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
