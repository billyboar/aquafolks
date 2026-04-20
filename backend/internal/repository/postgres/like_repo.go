package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"aquabook/internal/domain"
)

type LikeRepository struct {
	db *pgxpool.Pool
}

func NewLikeRepository(db *pgxpool.Pool) *LikeRepository {
	return &LikeRepository{db: db}
}

// Create creates a like (idempotent - no error if already exists)
func (r *LikeRepository) Create(ctx context.Context, userID, likeableType, likeableID string) error {
	query := `
		INSERT INTO likes (user_id, likeable_type, likeable_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, likeable_type, likeable_id) DO NOTHING
	`

	_, err := r.db.Exec(ctx, query, userID, likeableType, likeableID)
	if err != nil {
		return fmt.Errorf("failed to create like: %w", err)
	}

	return nil
}

// Delete removes a like
func (r *LikeRepository) Delete(ctx context.Context, userID, likeableType, likeableID string) error {
	query := `
		DELETE FROM likes
		WHERE user_id = $1 AND likeable_type = $2 AND likeable_id = $3
	`

	result, err := r.db.Exec(ctx, query, userID, likeableType, likeableID)
	if err != nil {
		return fmt.Errorf("failed to delete like: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("like not found")
	}

	return nil
}

// GetStats returns like count and whether the user has liked
func (r *LikeRepository) GetStats(ctx context.Context, likeableType, likeableID, userID string) (*domain.LikeStats, error) {
	stats := &domain.LikeStats{}

	// Get count and check if user liked in one query
	query := `
		SELECT 
			COUNT(*) as like_count,
			COALESCE(SUM(CASE WHEN user_id = $3 THEN 1 ELSE 0 END), 0) > 0 as is_liked
		FROM likes
		WHERE likeable_type = $1 AND likeable_id = $2
	`

	err := r.db.QueryRow(ctx, query, likeableType, likeableID, userID).Scan(&stats.LikeCount, &stats.IsLiked)
	if err != nil {
		return nil, fmt.Errorf("failed to get like stats: %w", err)
	}

	return stats, nil
}

// GetStatsAnonymous returns like count for unauthenticated users
func (r *LikeRepository) GetStatsAnonymous(ctx context.Context, likeableType, likeableID string) (*domain.LikeStats, error) {
	stats := &domain.LikeStats{IsLiked: false}

	query := `
		SELECT COUNT(*)
		FROM likes
		WHERE likeable_type = $1 AND likeable_id = $2
	`

	err := r.db.QueryRow(ctx, query, likeableType, likeableID).Scan(&stats.LikeCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get like count: %w", err)
	}

	return stats, nil
}

// IsLiked checks if a user has liked something
func (r *LikeRepository) IsLiked(ctx context.Context, userID, likeableType, likeableID string) (bool, error) {
	var exists bool

	query := `
		SELECT EXISTS(
			SELECT 1 FROM likes
			WHERE user_id = $1 AND likeable_type = $2 AND likeable_id = $3
		)
	`

	err := r.db.QueryRow(ctx, query, userID, likeableType, likeableID).Scan(&exists)
	if err != nil && err != pgx.ErrNoRows {
		return false, fmt.Errorf("failed to check like: %w", err)
	}

	return exists, nil
}

// GetCount returns the total number of likes for an entity
func (r *LikeRepository) GetCount(ctx context.Context, likeableType, likeableID string) (int, error) {
	var count int

	query := `
		SELECT COUNT(*)
		FROM likes
		WHERE likeable_type = $1 AND likeable_id = $2
	`

	err := r.db.QueryRow(ctx, query, likeableType, likeableID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get like count: %w", err)
	}

	return count, nil
}
