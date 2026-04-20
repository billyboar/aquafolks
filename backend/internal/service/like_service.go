package service

import (
	"context"
	"fmt"

	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"
)

type LikeService struct {
	likeRepo *postgres.LikeRepository
}

func NewLikeService(likeRepo *postgres.LikeRepository) *LikeService {
	return &LikeService{
		likeRepo: likeRepo,
	}
}

// ToggleLike toggles a like (creates if doesn't exist, deletes if exists)
func (s *LikeService) ToggleLike(ctx context.Context, userID, likeableType, likeableID string) (bool, error) {
	// Validate likeable type
	validTypes := map[string]bool{"tank": true, "listing": true, "project": true}
	if !validTypes[likeableType] {
		return false, fmt.Errorf("invalid likeable type: %s", likeableType)
	}

	// Check if already liked
	isLiked, err := s.likeRepo.IsLiked(ctx, userID, likeableType, likeableID)
	if err != nil {
		return false, fmt.Errorf("failed to check like status: %w", err)
	}

	if isLiked {
		// Unlike
		err = s.likeRepo.Delete(ctx, userID, likeableType, likeableID)
		if err != nil {
			return false, fmt.Errorf("failed to unlike: %w", err)
		}
		return false, nil
	} else {
		// Like
		err = s.likeRepo.Create(ctx, userID, likeableType, likeableID)
		if err != nil {
			return false, fmt.Errorf("failed to like: %w", err)
		}
		return true, nil
	}
}

// GetLikeStats returns like count and whether current user has liked
func (s *LikeService) GetLikeStats(ctx context.Context, likeableType, likeableID, userID string) (*domain.LikeStats, error) {
	if userID == "" {
		// Anonymous user
		return s.likeRepo.GetStatsAnonymous(ctx, likeableType, likeableID)
	}

	return s.likeRepo.GetStats(ctx, likeableType, likeableID, userID)
}
