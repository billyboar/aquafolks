package handler

import (
	"aquabook/internal/middleware"
	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CommentHandler struct {
	commentService *service.CommentService
}

func NewCommentHandler(commentService *service.CommentService) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
	}
}

// RegisterRoutes registers comment routes
func (h *CommentHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	// Comment routes
	app.Post("/api/v1/:type/:id/comments", middleware.JWTMiddleware(jwtSecret), h.CreateComment)
	app.Get("/api/v1/:type/:id/comments", h.GetComments)
	app.Put("/api/v1/comments/:comment_id", middleware.JWTMiddleware(jwtSecret), h.UpdateComment)
	app.Delete("/api/v1/comments/:comment_id", middleware.JWTMiddleware(jwtSecret), h.DeleteComment)
}

// CreateComment creates a new comment
func (h *CommentHandler) CreateComment(c *fiber.Ctx) error {
	commentableType := c.Params("type") // tank, listing, project
	commentableID := c.Params("id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	var req struct {
		Content string `json:"content"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	comment, err := h.commentService.CreateComment(c.Context(), userID, commentableType, commentableID, req.Content)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(comment)
}

// GetComments retrieves all comments for an entity
func (h *CommentHandler) GetComments(c *fiber.Ctx) error {
	commentableType := c.Params("type")
	commentableID := c.Params("id")

	comments, err := h.commentService.GetComments(c.Context(), commentableType, commentableID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(comments)
}

// UpdateComment updates a comment
func (h *CommentHandler) UpdateComment(c *fiber.Ctx) error {
	commentID := c.Params("comment_id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	var req struct {
		Content string `json:"content"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.commentService.UpdateComment(c.Context(), commentID, userID, req.Content)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Comment updated successfully",
	})
}

// DeleteComment deletes a comment
func (h *CommentHandler) DeleteComment(c *fiber.Ctx) error {
	commentID := c.Params("comment_id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	err := h.commentService.DeleteComment(c.Context(), commentID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Comment deleted successfully",
	})
}
