package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID              uuid.UUID  `json:"id"`
	Email           string     `json:"email"`
	Username        string     `json:"username"`
	PasswordHash    string     `json:"-"` // Never expose in JSON
	DisplayName     string     `json:"display_name"`
	AvatarURL       *string    `json:"avatar_url,omitempty"`
	Bio             *string    `json:"bio,omitempty"`
	LocationLat     *float64   `json:"location_lat,omitempty"`
	LocationLng     *float64   `json:"location_lng,omitempty"`
	LocationCity    *string    `json:"location_city,omitempty"`
	LocationState   *string    `json:"location_state,omitempty"`
	LocationCountry *string    `json:"location_country,omitempty"`
	Role            *UserRole  `json:"role,omitempty"`
	IsBanned        *bool      `json:"is_banned,omitempty"`
	BannedAt        *time.Time `json:"banned_at,omitempty"`
	BannedReason    *string    `json:"banned_reason,omitempty"`
	BannedBy        *uuid.UUID `json:"banned_by,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`
}

type CreateUserInput struct {
	Email           string  `json:"email" validate:"required,email"`
	Username        string  `json:"username" validate:"required,min=3,max=50"`
	Password        string  `json:"password" validate:"required,min=8"`
	DisplayName     string  `json:"display_name"`
	LocationLat     float64 `json:"location_lat"`
	LocationLng     float64 `json:"location_lng"`
	LocationCity    string  `json:"location_city"`
	LocationState   string  `json:"location_state"`
	LocationCountry string  `json:"location_country"`
}

type UpdateUserInput struct {
	DisplayName     *string  `json:"display_name"`
	Bio             *string  `json:"bio"`
	AvatarURL       *string  `json:"avatar_url"`
	LocationLat     *float64 `json:"location_lat"`
	LocationLng     *float64 `json:"location_lng"`
	LocationCity    *string  `json:"location_city"`
	LocationState   *string  `json:"location_state"`
	LocationCountry *string  `json:"location_country"`
}
