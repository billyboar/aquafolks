package handler

import (
	"aquabook/internal/middleware"
	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LikeHandler struct {
	likeService *service.LikeService
}

func NewLikeHandler(likeService *service.LikeService) *LikeHandler {
	return &LikeHandler{
		likeService: likeService,
	}
}

// RegisterRoutes registers like routes
func (h *LikeHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	// Like routes
	app.Post("/api/v1/:type/:id/like", middleware.JWTMiddleware(jwtSecret), h.ToggleLike)
	app.Get("/api/v1/:type/:id/likes", h.GetLikeStats)
}

// ToggleLike toggles a like
func (h *LikeHandler) ToggleLike(c *fiber.Ctx) error {
	likeableType := c.Params("type") // tank, listing, project
	likeableID := c.Params("id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	isLiked, err := h.likeService.ToggleLike(c.Context(), userID, likeableType, likeableID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"is_liked": isLiked,
		"message":  map[bool]string{true: "Liked", false: "Unliked"}[isLiked],
	})
}

// GetLikeStats returns like count and whether current user has liked
func (h *LikeHandler) GetLikeStats(c *fiber.Ctx) error {
	likeableType := c.Params("type")
	likeableID := c.Params("id")

	// Try to get user ID (optional for this endpoint)
	userID := ""
	if uid := c.Locals("user_id"); uid != nil {
		userID = uid.(uuid.UUID).String()
	}

	stats, err := h.likeService.GetLikeStats(c.Context(), likeableType, likeableID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(stats)
}
