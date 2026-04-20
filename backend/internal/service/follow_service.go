package service

import (
	"context"
	"fmt"

	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"

	"github.com/google/uuid"
)

type FollowService struct {
	followRepo *postgres.FollowRepository
	notifRepo  *postgres.NotificationRepository
}

func NewFollowService(followRepo *postgres.FollowRepository, notifRepo *postgres.NotificationRepository) *FollowService {
	return &FollowService{
		followRepo: followRepo,
		notifRepo:  notifRepo,
	}
}

// Follow creates a follow relationship and sends a notification
func (s *FollowService) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	// Validate that user is not trying to follow themselves
	if followerID == followingID {
		return fmt.Errorf("cannot follow yourself")
	}

	// Check if already following
	isFollowing, err := s.followRepo.IsFollowing(ctx, followerID, followingID)
	if err != nil {
		return fmt.Errorf("failed to check follow status: %w", err)
	}
	if isFollowing {
		return nil // Already following, no error
	}

	// Create follow relationship
	if err := s.followRepo.Follow(ctx, followerID, followingID); err != nil {
		return fmt.Errorf("failed to follow user: %w", err)
	}

	// Create notification for the user being followed
	notification := &domain.CreateNotificationInput{
		UserID:  followingID,
		ActorID: &followerID,
		Type:    domain.NotificationTypeFollow,
		Title:   "New Follower",
		Message: "started following you",
		Link:    fmt.Sprintf("/users/%s", followerID.String()),
	}
	_, err = s.notifRepo.Create(ctx, notification)
	if err != nil {
		// Log error but don't fail the follow action
		fmt.Printf("failed to create follow notification: %v\n", err)
	}

	return nil
}

// Unfollow removes a follow relationship
func (s *FollowService) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	// Validate that user is not trying to unfollow themselves
	if followerID == followingID {
		return fmt.Errorf("invalid unfollow operation")
	}

	if err := s.followRepo.Unfollow(ctx, followerID, followingID); err != nil {
		return fmt.Errorf("failed to unfollow user: %w", err)
	}

	return nil
}

// IsFollowing checks if followerID follows followingID
func (s *FollowService) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	return s.followRepo.IsFollowing(ctx, followerID, followingID)
}

// GetFollowers returns a list of users who follow the given user
func (s *FollowService) GetFollowers(ctx context.Context, userID uuid.UUID, currentUserID *uuid.UUID, limit, offset int) ([]*domain.FollowUser, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return s.followRepo.GetFollowers(ctx, userID, currentUserID, limit, offset)
}

// GetFollowing returns a list of users that the given user follows
func (s *FollowService) GetFollowing(ctx context.Context, userID uuid.UUID, currentUserID *uuid.UUID, limit, offset int) ([]*domain.FollowUser, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return s.followRepo.GetFollowing(ctx, userID, currentUserID, limit, offset)
}

// GetFollowStats returns follow statistics for a user
func (s *FollowService) GetFollowStats(ctx context.Context, userID uuid.UUID, currentUserID *uuid.UUID) (*domain.FollowStats, error) {
	return s.followRepo.GetFollowStats(ctx, userID, currentUserID)
}

// CountFollowers returns the number of followers for a user
func (s *FollowService) CountFollowers(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.followRepo.CountFollowers(ctx, userID)
}

// CountFollowing returns the number of users a user is following
func (s *FollowService) CountFollowing(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.followRepo.CountFollowing(ctx, userID)
}
