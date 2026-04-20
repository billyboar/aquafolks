package postgres

import (
	"context"
	"fmt"

	"aquabook/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FollowRepository struct {
	db *pgxpool.Pool
}

func NewFollowRepository(db *pgxpool.Pool) *FollowRepository {
	return &FollowRepository{db: db}
}

// Follow creates a new follow relationship
func (r *FollowRepository) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	query := `
		INSERT INTO followers (follower_id, following_id)
		VALUES ($1, $2)
		ON CONFLICT (follower_id, following_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, followerID, followingID)
	return err
}

// Unfollow removes a follow relationship
func (r *FollowRepository) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	query := `
		DELETE FROM followers
		WHERE follower_id = $1 AND following_id = $2
	`
	_, err := r.db.Exec(ctx, query, followerID, followingID)
	return err
}

// IsFollowing checks if followerID follows followingID
func (r *FollowRepository) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM followers
			WHERE follower_id = $1 AND following_id = $2
		)
	`
	var exists bool
	err := r.db.QueryRow(ctx, query, followerID, followingID).Scan(&exists)
	return exists, err
}

// GetFollowers returns a list of users who follow the given user
func (r *FollowRepository) GetFollowers(ctx context.Context, userID uuid.UUID, currentUserID *uuid.UUID, limit, offset int) ([]*domain.FollowUser, error) {
	query := `
		SELECT 
			u.id,
			u.username,
			u.display_name,
			COALESCE(u.avatar_url, '') as avatar_url,
			COALESCE(u.bio, '') as bio,
			f.created_at as followed_at,
			CASE WHEN $2::uuid IS NOT NULL THEN 
				EXISTS(SELECT 1 FROM followers WHERE follower_id = $2 AND following_id = u.id)
			ELSE false END as is_following,
			CASE WHEN $2::uuid IS NOT NULL THEN
				EXISTS(SELECT 1 FROM followers WHERE follower_id = u.id AND following_id = $2)
			ELSE false END as is_follower
		FROM users u
		INNER JOIN followers f ON f.follower_id = u.id
		WHERE f.following_id = $1
		ORDER BY f.created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.Query(ctx, query, userID, currentUserID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []*domain.FollowUser
	for rows.Next() {
		var user domain.FollowUser
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.DisplayName,
			&user.AvatarURL,
			&user.Bio,
			&user.FollowedAt,
			&user.IsFollowing,
			&user.IsFollower,
		)
		if err != nil {
			return nil, err
		}
		followers = append(followers, &user)
	}

	return followers, rows.Err()
}

// GetFollowing returns a list of users that the given user follows
func (r *FollowRepository) GetFollowing(ctx context.Context, userID uuid.UUID, currentUserID *uuid.UUID, limit, offset int) ([]*domain.FollowUser, error) {
	query := `
		SELECT 
			u.id,
			u.username,
			u.display_name,
			COALESCE(u.avatar_url, '') as avatar_url,
			COALESCE(u.bio, '') as bio,
			f.created_at as followed_at,
			CASE WHEN $2::uuid IS NOT NULL THEN 
				EXISTS(SELECT 1 FROM followers WHERE follower_id = $2 AND following_id = u.id)
			ELSE false END as is_following,
			CASE WHEN $2::uuid IS NOT NULL THEN
				EXISTS(SELECT 1 FROM followers WHERE follower_id = u.id AND following_id = $2)
			ELSE false END as is_follower
		FROM users u
		INNER JOIN followers f ON f.following_id = u.id
		WHERE f.follower_id = $1
		ORDER BY f.created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.Query(ctx, query, userID, currentUserID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []*domain.FollowUser
	for rows.Next() {
		var user domain.FollowUser
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.DisplayName,
			&user.AvatarURL,
			&user.Bio,
			&user.FollowedAt,
			&user.IsFollowing,
			&user.IsFollower,
		)
		if err != nil {
			return nil, err
		}
		following = append(following, &user)
	}

	return following, rows.Err()
}

// GetFollowStats returns follow statistics for a user
func (r *FollowRepository) GetFollowStats(ctx context.Context, userID uuid.UUID, currentUserID *uuid.UUID) (*domain.FollowStats, error) {
	query := `
		SELECT 
			COALESCE(u.follower_count, 0) as follower_count,
			COALESCE(u.following_count, 0) as following_count,
			CASE WHEN $2::uuid IS NOT NULL THEN
				EXISTS(SELECT 1 FROM followers WHERE follower_id = $2 AND following_id = $1)
			ELSE false END as is_following,
			CASE WHEN $2::uuid IS NOT NULL THEN
				EXISTS(SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2)
			ELSE false END as is_followed_by
		FROM users u
		WHERE u.id = $1
	`

	var stats domain.FollowStats
	err := r.db.QueryRow(ctx, query, userID, currentUserID).Scan(
		&stats.FollowerCount,
		&stats.FollowingCount,
		&stats.IsFollowing,
		&stats.IsFollowedBy,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get follow stats: %w", err)
	}

	return &stats, nil
}

// CountFollowers returns the number of followers for a user
func (r *FollowRepository) CountFollowers(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT follower_count FROM users WHERE id = $1`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

// CountFollowing returns the number of users a user is following
func (r *FollowRepository) CountFollowing(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT following_count FROM users WHERE id = $1`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}
