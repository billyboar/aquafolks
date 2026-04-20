package handler

import (
	"strconv"

	"aquabook/internal/middleware"
	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type FollowHandler struct {
	followService *service.FollowService
}

func NewFollowHandler(followService *service.FollowService) *FollowHandler {
	return &FollowHandler{
		followService: followService,
	}
}

// RegisterRoutes registers all follow routes
func (h *FollowHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	users := app.Group("/api/v1/users")

	// Public routes - followers/following lists and stats
	users.Get("/:id/followers", h.GetFollowers)
	users.Get("/:id/following", h.GetFollowing)
	users.Get("/:id/follow-stats", h.GetFollowStats)

	// Protected routes - require authentication
	users.Post("/:id/follow", middleware.JWTMiddleware(jwtSecret), h.Follow)
	users.Delete("/:id/follow", middleware.JWTMiddleware(jwtSecret), h.Unfollow)
}

// Follow godoc
// @Summary Follow a user
// @Description Follow another user
// @Tags follows
// @Accept json
// @Produce json
// @Param id path string true "User ID to follow"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users/{id}/follow [post]
func (h *FollowHandler) Follow(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	followingIDStr := c.Params("id")

	followingID, err := uuid.Parse(followingIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	if err := h.followService.Follow(c.Context(), userID, followingID); err != nil {
		if err.Error() == "cannot follow yourself" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to follow user",
		})
	}

	return c.JSON(fiber.Map{
		"message":      "User followed successfully",
		"is_following": true,
	})
}

// Unfollow godoc
// @Summary Unfollow a user
// @Description Unfollow another user
// @Tags follows
// @Accept json
// @Produce json
// @Param id path string true "User ID to unfollow"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users/{id}/follow [delete]
func (h *FollowHandler) Unfollow(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	followingIDStr := c.Params("id")

	followingID, err := uuid.Parse(followingIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	if err := h.followService.Unfollow(c.Context(), userID, followingID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to unfollow user",
		})
	}

	return c.JSON(fiber.Map{
		"message":      "User unfollowed successfully",
		"is_following": false,
	})
}

// GetFollowers godoc
// @Summary Get user's followers
// @Description Get a list of users who follow the specified user
// @Tags follows
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param limit query int false "Limit" default(20)
// @Param page query int false "Page" default(1)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users/{id}/followers [get]
func (h *FollowHandler) GetFollowers(c *fiber.Ctx) error {
	userIDStr := c.Params("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Get optional current user ID
	var currentUserID *uuid.UUID
	if uid := c.Locals("user_id"); uid != nil {
		id := uid.(uuid.UUID)
		currentUserID = &id
	}

	// Parse pagination
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	offset := (page - 1) * limit

	followers, err := h.followService.GetFollowers(c.Context(), userID, currentUserID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get followers",
		})
	}

	// Get total count
	total, err := h.followService.CountFollowers(c.Context(), userID)
	if err != nil {
		total = 0
	}

	return c.JSON(fiber.Map{
		"followers": followers,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

// GetFollowing godoc
// @Summary Get users that user follows
// @Description Get a list of users that the specified user follows
// @Tags follows
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param limit query int false "Limit" default(20)
// @Param page query int false "Page" default(1)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users/{id}/following [get]
func (h *FollowHandler) GetFollowing(c *fiber.Ctx) error {
	userIDStr := c.Params("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Get optional current user ID
	var currentUserID *uuid.UUID
	if uid := c.Locals("user_id"); uid != nil {
		id := uid.(uuid.UUID)
		currentUserID = &id
	}

	// Parse pagination
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	offset := (page - 1) * limit

	following, err := h.followService.GetFollowing(c.Context(), userID, currentUserID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get following",
		})
	}

	// Get total count
	total, err := h.followService.CountFollowing(c.Context(), userID)
	if err != nil {
		total = 0
	}

	return c.JSON(fiber.Map{
		"following": following,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

// GetFollowStats godoc
// @Summary Get follow statistics
// @Description Get follow statistics for a user
// @Tags follows
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} domain.FollowStats
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users/{id}/follow-stats [get]
func (h *FollowHandler) GetFollowStats(c *fiber.Ctx) error {
	userIDStr := c.Params("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Get optional current user ID
	var currentUserID *uuid.UUID
	if uid := c.Locals("user_id"); uid != nil {
		id := uid.(uuid.UUID)
		currentUserID = &id
	}

	stats, err := h.followService.GetFollowStats(c.Context(), userID, currentUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get follow stats",
		})
	}

	return c.JSON(stats)
}
