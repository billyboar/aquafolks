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

type PasswordResetRepository struct {
	db *pgxpool.Pool
}

func NewPasswordResetRepository(db *pgxpool.Pool) *PasswordResetRepository {
	return &PasswordResetRepository{db: db}
}

// Create creates a new password reset token
func (r *PasswordResetRepository) Create(ctx context.Context, token *domain.PasswordResetToken) error {
	query := `
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	token.ID = uuid.New()
	token.CreatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create password reset token: %w", err)
	}

	return nil
}

// GetByToken retrieves a password reset token by its token string
func (r *PasswordResetRepository) GetByToken(ctx context.Context, tokenStr string) (*domain.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, used_at, created_at
		FROM password_reset_tokens
		WHERE token = $1
	`

	var token domain.PasswordResetToken
	err := r.db.QueryRow(ctx, query, tokenStr).Scan(
		&token.ID,
		&token.UserID,
		&token.Token,
		&token.ExpiresAt,
		&token.UsedAt,
		&token.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("token not found")
		}
		return nil, fmt.Errorf("failed to get password reset token: %w", err)
	}

	return &token, nil
}

// MarkAsUsed marks a password reset token as used
func (r *PasswordResetRepository) MarkAsUsed(ctx context.Context, tokenID uuid.UUID) error {
	query := `
		UPDATE password_reset_tokens
		SET used_at = $2
		WHERE id = $1
	`

	now := time.Now()
	result, err := r.db.Exec(ctx, query, tokenID, now)
	if err != nil {
		return fmt.Errorf("failed to mark token as used: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("token not found")
	}

	return nil
}

// DeleteExpired deletes all expired tokens
func (r *PasswordResetRepository) DeleteExpired(ctx context.Context) error {
	query := `
		DELETE FROM password_reset_tokens
		WHERE expires_at < NOW()
	`

	_, err := r.db.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to delete expired tokens: %w", err)
	}

	return nil
}

// DeleteByUserID deletes all password reset tokens for a specific user
func (r *PasswordResetRepository) DeleteByUserID(ctx context.Context, userID uuid.UUID) error {
	query := `
		DELETE FROM password_reset_tokens
		WHERE user_id = $1
	`

	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete tokens for user: %w", err)
	}

	return nil
}
