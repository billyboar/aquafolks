package domain

import (
	"time"

	"github.com/google/uuid"
)

// Follow represents a follower relationship between users
type Follow struct {
	ID          uuid.UUID `json:"id"`
	FollowerID  uuid.UUID `json:"follower_id"`
	FollowingID uuid.UUID `json:"following_id"`
	CreatedAt   time.Time `json:"created_at"`
}

// FollowUser represents a user in a follow list with their details
type FollowUser struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	AvatarURL   string    `json:"avatar_url"`
	Bio         string    `json:"bio"`
	FollowedAt  time.Time `json:"followed_at"`
	IsFollowing bool      `json:"is_following"` // Current user follows this user
	IsFollower  bool      `json:"is_follower"`  // This user follows current user
}

// FollowStats represents follow statistics for a user
type FollowStats struct {
	FollowerCount  int  `json:"follower_count"`
	FollowingCount int  `json:"following_count"`
	IsFollowing    bool `json:"is_following"`   // Current user follows this user
	IsFollowedBy   bool `json:"is_followed_by"` // This user follows current user
}
