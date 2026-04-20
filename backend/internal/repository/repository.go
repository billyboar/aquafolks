package repository

import (
	"aquabook/internal/domain"
	"context"

	"github.com/google/uuid"
)

// UserRepository defines database operations for users
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*domain.User, error)
}

// TankRepository defines database operations for tanks
type TankRepository interface {
	Create(ctx context.Context, tank *domain.Tank) error
	GetByID(ctx context.Context, id string) (*domain.Tank, error)
	GetByUserID(ctx context.Context, userID string) ([]*domain.Tank, error)
	Update(ctx context.Context, id string, input *domain.UpdateTankInput) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, limit, offset int) ([]*domain.Tank, error)

	// Photos
	AddPhoto(ctx context.Context, photo *domain.TankPhoto) error
	DeletePhoto(ctx context.Context, photoID string) error

	// Livestock
	AddLivestock(ctx context.Context, livestock *domain.Livestock) error
	DeleteLivestock(ctx context.Context, livestockID string) error
}

// ListingRepository defines database operations for marketplace listings
type ListingRepository interface {
	Create(ctx context.Context, listing *domain.Listing) error
	GetByID(ctx context.Context, id string) (*domain.Listing, error)
	GetByUserID(ctx context.Context, userID string) ([]*domain.Listing, error)
	Update(ctx context.Context, id string, input *domain.Listing) error
	Delete(ctx context.Context, id string) error

	// Search with filters (including PostGIS radius search)
	Search(ctx context.Context, filter *domain.SearchListingsFilter) ([]*domain.Listing, error)

	// Photos
	AddPhoto(ctx context.Context, photo *domain.ListingPhoto) error
	DeletePhoto(ctx context.Context, photoID string) error
}

// PasswordResetRepository defines database operations for password reset tokens
type PasswordResetRepository interface {
	Create(ctx context.Context, token *domain.PasswordResetToken) error
	GetByToken(ctx context.Context, token string) (*domain.PasswordResetToken, error)
	MarkAsUsed(ctx context.Context, tokenID uuid.UUID) error
	DeleteExpired(ctx context.Context) error
	DeleteByUserID(ctx context.Context, userID uuid.UUID) error
}
