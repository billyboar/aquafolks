package domain

import "time"

type Like struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	LikeableType string    `json:"likeable_type"` // tank, listing, project
	LikeableID   string    `json:"likeable_id"`
	CreatedAt    time.Time `json:"created_at"`
}

type LikeStats struct {
	LikeCount int  `json:"like_count"`
	IsLiked   bool `json:"is_liked"` // Whether current user has liked
}
