package handler

import (
	"fmt"

	"aquabook/internal/middleware"
	"aquabook/internal/service"
	"aquabook/pkg/storage"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CommentHandler struct {
	commentService *service.CommentService
	storage        *storage.S3Client
}

func NewCommentHandler(commentService *service.CommentService, storage *storage.S3Client) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
		storage:        storage,
	}
}

// RegisterRoutes registers comment routes
func (h *CommentHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	app.Post("/api/v1/:type/:id/comments", middleware.JWTMiddleware(jwtSecret), h.CreateComment)
	app.Get("/api/v1/:type/:id/comments", h.GetComments)
	app.Put("/api/v1/comments/:comment_id", middleware.JWTMiddleware(jwtSecret), h.UpdateComment)
	app.Delete("/api/v1/comments/:comment_id", middleware.JWTMiddleware(jwtSecret), h.DeleteComment)
	app.Post("/api/v1/comments/upload-image", middleware.JWTMiddleware(jwtSecret), h.UploadImage)
}

// CreateComment creates a new comment
func (h *CommentHandler) CreateComment(c *fiber.Ctx) error {
	commentableType := c.Params("type")
	commentableID := c.Params("id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	var req struct {
		Content   string   `json:"content"`
		ImageURLs []string `json:"image_urls"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	comment, err := h.commentService.CreateComment(c.Context(), userID, commentableType, commentableID, req.Content, req.ImageURLs)
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

// UploadImage uploads an image for use in a comment
func (h *CommentHandler) UploadImage(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID).String()

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Image file is required",
		})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to open file",
		})
	}
	defer src.Close()

	contentType := file.Header.Get("Content-Type")
	if len(contentType) < 6 || contentType[:6] != "image/" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only image files are allowed",
		})
	}

	const maxSize = int64(10 * 1024 * 1024) // 10MB
	if file.Size > maxSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("File too large: max %dMB", maxSize/(1024*1024)),
		})
	}

	imageURL, err := h.storage.UploadFile(c.Context(), src, file, fmt.Sprintf("comments/%s", userID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to upload image",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"image_url": imageURL,
	})
}
