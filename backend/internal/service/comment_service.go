package service

import (
	"context"
	"fmt"

	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"
)

type CommentService struct {
	commentRepo *postgres.CommentRepository
}

func NewCommentService(commentRepo *postgres.CommentRepository) *CommentService {
	return &CommentService{
		commentRepo: commentRepo,
	}
}

// CreateComment creates a new comment
func (s *CommentService) CreateComment(ctx context.Context, userID, commentableType, commentableID, content string) (*domain.Comment, error) {
	// Validate commentable type
	validTypes := map[string]bool{"tank": true, "listing": true, "project": true}
	if !validTypes[commentableType] {
		return nil, fmt.Errorf("invalid commentable type: %s", commentableType)
	}

	// Validate content
	if len(content) == 0 {
		return nil, fmt.Errorf("comment content cannot be empty")
	}
	if len(content) > 2000 {
		return nil, fmt.Errorf("comment content too long (max 2000 characters)")
	}

	return s.commentRepo.Create(ctx, userID, commentableType, commentableID, content)
}

// GetComments retrieves all comments for a commentable entity
func (s *CommentService) GetComments(ctx context.Context, commentableType, commentableID string) ([]domain.Comment, error) {
	return s.commentRepo.GetByCommentable(ctx, commentableType, commentableID)
}

// UpdateComment updates a comment (only by owner)
func (s *CommentService) UpdateComment(ctx context.Context, commentID, userID, content string) error {
	// Get comment to verify ownership
	comment, err := s.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return fmt.Errorf("comment not found: %w", err)
	}

	if comment.UserID != userID {
		return fmt.Errorf("unauthorized: not comment owner")
	}

	// Validate content
	if len(content) == 0 {
		return fmt.Errorf("comment content cannot be empty")
	}
	if len(content) > 2000 {
		return fmt.Errorf("comment content too long (max 2000 characters)")
	}

	return s.commentRepo.Update(ctx, commentID, content)
}

// DeleteComment deletes a comment (only by owner)
func (s *CommentService) DeleteComment(ctx context.Context, commentID, userID string) error {
	// Get comment to verify ownership
	comment, err := s.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return fmt.Errorf("comment not found: %w", err)
	}

	if comment.UserID != userID {
		return fmt.Errorf("unauthorized: not comment owner")
	}

	return s.commentRepo.Delete(ctx, commentID)
}

// GetCommentCount returns the number of comments for an entity
func (s *CommentService) GetCommentCount(ctx context.Context, commentableType, commentableID string) (int, error) {
	return s.commentRepo.GetCountByCommentable(ctx, commentableType, commentableID)
}
