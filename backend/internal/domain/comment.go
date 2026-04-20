package domain

import "time"

type Comment struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	CommentableType string    `json:"commentable_type"` // tank, listing, project
	CommentableID   string    `json:"commentable_id"`
	Content         string    `json:"content"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	User *User `json:"user,omitempty"`
}

type CreateCommentInput struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}

type UpdateCommentInput struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}
