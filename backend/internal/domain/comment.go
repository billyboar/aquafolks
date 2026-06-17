package domain

import "time"

type Comment struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	CommentableType string    `json:"commentable_type"`
	CommentableID   string    `json:"commentable_id"`
	Content         string    `json:"content"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	User   *User          `json:"user,omitempty"`
	Images []CommentImage `json:"images,omitempty"`
}

type CommentImage struct {
	ID           string    `json:"id"`
	CommentID    string    `json:"comment_id"`
	ImageURL     string    `json:"image_url"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateCommentInput struct {
	Content   string   `json:"content" validate:"required,min=1,max=2000"`
	ImageURLs []string `json:"image_urls"`
}

type UpdateCommentInput struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}
