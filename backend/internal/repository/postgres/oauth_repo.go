package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"aquabook/internal/domain"
)

type OAuthRepository struct {
	db *pgxpool.Pool
}

func NewOAuthRepository(db *pgxpool.Pool) *OAuthRepository {
	return &OAuthRepository{db: db}
}

// GetByProvider finds an oauth_account by provider + provider_id
func (r *OAuthRepository) GetByProvider(ctx context.Context, provider, providerID string) (*domain.OAuthAccount, error) {
	query := `
		SELECT id, user_id, provider, provider_id, email, created_at, updated_at
		FROM oauth_accounts
		WHERE provider = $1 AND provider_id = $2
	`

	var acc domain.OAuthAccount
	err := r.db.QueryRow(ctx, query, provider, providerID).Scan(
		&acc.ID,
		&acc.UserID,
		&acc.Provider,
		&acc.ProviderID,
		&acc.Email,
		&acc.CreatedAt,
		&acc.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("oauth account not found")
		}
		return nil, fmt.Errorf("failed to get oauth account: %w", err)
	}

	return &acc, nil
}

// Create creates a new oauth_account record
func (r *OAuthRepository) Create(ctx context.Context, acc *domain.OAuthAccount) error {
	query := `
		INSERT INTO oauth_accounts (id, user_id, provider, provider_id, email, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	now := time.Now()
	acc.ID = uuid.New()
	acc.CreatedAt = now
	acc.UpdatedAt = now

	_, err := r.db.Exec(ctx, query,
		acc.ID,
		acc.UserID,
		acc.Provider,
		acc.ProviderID,
		acc.Email,
		acc.CreatedAt,
		acc.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create oauth account: %w", err)
	}

	return nil
}
