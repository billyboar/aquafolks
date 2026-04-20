package service

import (
	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type NotificationService struct {
	notificationRepo *postgres.NotificationRepository
}

func NewNotificationService(notificationRepo *postgres.NotificationRepository) *NotificationService {
	return &NotificationService{
		notificationRepo: notificationRepo,
	}
}

// Notification CRUD

func (s *NotificationService) CreateNotification(ctx context.Context, input *domain.CreateNotificationInput) (*domain.Notification, error) {
	return s.notificationRepo.Create(ctx, input)
}

func (s *NotificationService) GetNotifications(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Notification, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return s.notificationRepo.GetByUserID(ctx, userID, limit, offset)
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.notificationRepo.GetUnreadCount(ctx, userID)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	return s.notificationRepo.MarkAsRead(ctx, notificationID, userID)
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.notificationRepo.MarkAllAsRead(ctx, userID)
}

func (s *NotificationService) DeleteNotification(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	return s.notificationRepo.Delete(ctx, notificationID, userID)
}

// Project Subscriptions

func (s *NotificationService) SubscribeToProject(ctx context.Context, userID, projectID uuid.UUID) (*domain.ProjectSubscription, error) {
	return s.notificationRepo.CreateProjectSubscription(ctx, userID, projectID)
}

func (s *NotificationService) UnsubscribeFromProject(ctx context.Context, userID, projectID uuid.UUID) error {
	return s.notificationRepo.DeleteProjectSubscription(ctx, userID, projectID)
}

func (s *NotificationService) IsSubscribedToProject(ctx context.Context, userID, projectID uuid.UUID) (bool, error) {
	return s.notificationRepo.IsSubscribedToProject(ctx, userID, projectID)
}

// User Follows

func (s *NotificationService) FollowUser(ctx context.Context, followerID, followingID uuid.UUID) (*domain.UserFollow, error) {
	if followerID == followingID {
		return nil, fmt.Errorf("cannot follow yourself")
	}

	follow, err := s.notificationRepo.CreateUserFollow(ctx, followerID, followingID)
	if err != nil {
		return nil, err
	}

	// Create notification for the followed user
	entityType := domain.EntityType("user")
	_, _ = s.notificationRepo.Create(ctx, &domain.CreateNotificationInput{
		UserID:     followingID,
		ActorID:    &followerID,
		Type:       domain.NotificationTypeFollow,
		EntityType: &entityType,
		EntityID:   &followerID,
		Title:      "New Follower",
		Message:    "started following you",
		Link:       fmt.Sprintf("/users/%s", followerID),
	})

	return follow, nil
}

func (s *NotificationService) UnfollowUser(ctx context.Context, followerID, followingID uuid.UUID) error {
	return s.notificationRepo.DeleteUserFollow(ctx, followerID, followingID)
}

func (s *NotificationService) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	return s.notificationRepo.IsFollowing(ctx, followerID, followingID)
}

func (s *NotificationService) GetFollowers(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	return s.notificationRepo.GetFollowers(ctx, userID)
}

func (s *NotificationService) GetFollowing(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	return s.notificationRepo.GetFollowing(ctx, userID)
}

// Notification Preferences

func (s *NotificationService) GetNotificationPreferences(ctx context.Context, userID uuid.UUID) (*domain.NotificationPreferences, error) {
	return s.notificationRepo.GetNotificationPreferences(ctx, userID)
}

func (s *NotificationService) UpdateNotificationPreferences(ctx context.Context, userID uuid.UUID, prefs *domain.NotificationPreferences) error {
	return s.notificationRepo.UpdateNotificationPreferences(ctx, userID, prefs)
}

// Helper functions to create specific notification types

func (s *NotificationService) NotifyNewComment(ctx context.Context, contentOwnerID, commenterID uuid.UUID, entityType domain.EntityType, entityID uuid.UUID, entityTitle string) error {
	// Don't notify if commenting on own content
	if contentOwnerID == commenterID {
		return nil
	}

	_, err := s.notificationRepo.Create(ctx, &domain.CreateNotificationInput{
		UserID:     contentOwnerID,
		ActorID:    &commenterID,
		Type:       domain.NotificationTypeComment,
		EntityType: &entityType,
		EntityID:   &entityID,
		Title:      "New Comment",
		Message:    fmt.Sprintf("commented on your %s", entityType),
		Link:       fmt.Sprintf("/%ss/%s", entityType, entityID),
	})

	return err
}

func (s *NotificationService) NotifyNewLike(ctx context.Context, contentOwnerID, likerID uuid.UUID, entityType domain.EntityType, entityID uuid.UUID) error {
	// Don't notify if liking own content
	if contentOwnerID == likerID {
		return nil
	}

	_, err := s.notificationRepo.Create(ctx, &domain.CreateNotificationInput{
		UserID:     contentOwnerID,
		ActorID:    &likerID,
		Type:       domain.NotificationTypeLike,
		EntityType: &entityType,
		EntityID:   &entityID,
		Title:      "New Like",
		Message:    fmt.Sprintf("liked your %s", entityType),
		Link:       fmt.Sprintf("/%ss/%s", entityType, entityID),
	})

	return err
}

func (s *NotificationService) NotifyProjectUpdate(ctx context.Context, projectID uuid.UUID, projectTitle, updateTitle string) error {
	// Get all subscribers
	subscribers, err := s.notificationRepo.GetProjectSubscribers(ctx, projectID)
	if err != nil {
		return err
	}

	entityType := domain.EntityTypeProject

	// Create notification for each subscriber
	for _, subscriberID := range subscribers {
		_, _ = s.notificationRepo.Create(ctx, &domain.CreateNotificationInput{
			UserID:     subscriberID,
			Type:       domain.NotificationTypeProjectUpdate,
			EntityType: &entityType,
			EntityID:   &projectID,
			Title:      fmt.Sprintf("Project Update: %s", projectTitle),
			Message:    updateTitle,
			Link:       fmt.Sprintf("/projects/%s", projectID),
		})
	}

	return nil
}

func (s *NotificationService) NotifyNewMessage(ctx context.Context, receiverID, senderID uuid.UUID) error {
	entityType := domain.EntityTypeMessage

	_, err := s.notificationRepo.Create(ctx, &domain.CreateNotificationInput{
		UserID:     receiverID,
		ActorID:    &senderID,
		Type:       domain.NotificationTypeMessage,
		EntityType: &entityType,
		EntityID:   &senderID,
		Title:      "New Message",
		Message:    "sent you a message",
		Link:       fmt.Sprintf("/messages/%s", senderID),
	})

	return err
}
