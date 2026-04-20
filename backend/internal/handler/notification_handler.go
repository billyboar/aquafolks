package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	notificationService *service.NotificationService
}

func NewNotificationHandler(notificationService *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService}
}

// RegisterRoutes registers all notification routes
func (h *NotificationHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	notifications := app.Group("/api/v1/notifications", middleware.JWTMiddleware(jwtSecret))

	notifications.Get("/", h.GetNotifications)
	notifications.Get("/unread-count", h.GetUnreadCount)
	notifications.Put("/:id/read", h.MarkAsRead)
	notifications.Put("/read-all", h.MarkAllAsRead)
	notifications.Delete("/:id", h.DeleteNotification)

	// Project subscriptions
	subscriptions := app.Group("/api/v1/subscriptions", middleware.JWTMiddleware(jwtSecret))
	subscriptions.Post("/projects/:id", h.SubscribeToProject)
	subscriptions.Delete("/projects/:id", h.UnsubscribeFromProject)
	subscriptions.Get("/projects/:id/status", h.GetProjectSubscriptionStatus)

	// Notification preferences
	prefs := app.Group("/api/v1/settings", middleware.JWTMiddleware(jwtSecret))
	prefs.Get("/notification-preferences", h.GetNotificationPreferences)
	prefs.Put("/notification-preferences", h.UpdateNotificationPreferences)
}

// GetNotifications godoc
func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	notifications, err := h.notificationService.GetNotifications(c.Context(), userID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"notifications": notifications,
	})
}

// GetUnreadCount godoc
func (h *NotificationHandler) GetUnreadCount(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	count, err := h.notificationService.GetUnreadCount(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"unread_count": count,
	})
}

// MarkAsRead godoc
func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid notification ID",
		})
	}

	if err := h.notificationService.MarkAsRead(c.Context(), notificationID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "notification marked as read",
	})
}

// MarkAllAsRead godoc
func (h *NotificationHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	if err := h.notificationService.MarkAllAsRead(c.Context(), userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "all notifications marked as read",
	})
}

// DeleteNotification godoc
func (h *NotificationHandler) DeleteNotification(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid notification ID",
		})
	}

	if err := h.notificationService.DeleteNotification(c.Context(), notificationID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "notification deleted",
	})
}

// SubscribeToProject godoc
func (h *NotificationHandler) SubscribeToProject(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project ID",
		})
	}

	subscription, err := h.notificationService.SubscribeToProject(c.Context(), userID, projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"subscription": subscription,
	})
}

// UnsubscribeFromProject godoc
func (h *NotificationHandler) UnsubscribeFromProject(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project ID",
		})
	}

	if err := h.notificationService.UnsubscribeFromProject(c.Context(), userID, projectID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "unsubscribed from project",
	})
}

// GetProjectSubscriptionStatus godoc
func (h *NotificationHandler) GetProjectSubscriptionStatus(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project ID",
		})
	}

	isSubscribed, err := h.notificationService.IsSubscribedToProject(c.Context(), userID, projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"is_subscribed": isSubscribed,
	})
}

// FollowUser godoc
func (h *NotificationHandler) FollowUser(c *fiber.Ctx) error {
	followerID := c.Locals("user_id").(uuid.UUID)
	followingID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	follow, err := h.notificationService.FollowUser(c.Context(), followerID, followingID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"follow": follow,
	})
}

// UnfollowUser godoc
func (h *NotificationHandler) UnfollowUser(c *fiber.Ctx) error {
	followerID := c.Locals("user_id").(uuid.UUID)
	followingID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	if err := h.notificationService.UnfollowUser(c.Context(), followerID, followingID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "unfollowed user",
	})
}

// GetFollowStatus godoc
func (h *NotificationHandler) GetFollowStatus(c *fiber.Ctx) error {
	followerID := c.Locals("user_id").(uuid.UUID)
	followingID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	isFollowing, err := h.notificationService.IsFollowing(c.Context(), followerID, followingID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"is_following": isFollowing,
	})
}

// GetFollowers godoc
func (h *NotificationHandler) GetFollowers(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	followers, err := h.notificationService.GetFollowers(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"followers": followers,
		"count":     len(followers),
	})
}

// GetFollowing godoc
func (h *NotificationHandler) GetFollowing(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	following, err := h.notificationService.GetFollowing(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"following": following,
		"count":     len(following),
	})
}

// GetNotificationPreferences godoc
func (h *NotificationHandler) GetNotificationPreferences(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	prefs, err := h.notificationService.GetNotificationPreferences(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(prefs)
}

// UpdateNotificationPreferences godoc
func (h *NotificationHandler) UpdateNotificationPreferences(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	var prefs domain.NotificationPreferences
	if err := c.BodyParser(&prefs); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	if err := h.notificationService.UpdateNotificationPreferences(c.Context(), userID, &prefs); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "notification preferences updated",
	})
}
