package handler

import (
	"aquabook/internal/middleware"
	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TankPhotoHandler struct {
	photoService *service.TankPhotoService
}

func NewTankPhotoHandler(photoService *service.TankPhotoService) *TankPhotoHandler {
	return &TankPhotoHandler{
		photoService: photoService,
	}
}

// RegisterRoutes registers all tank photo routes
func (h *TankPhotoHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	// Tank photo routes (require auth)
	tanks := app.Group("/api/v1/tanks")
	tanks.Post("/:tank_id/photos", middleware.JWTMiddleware(jwtSecret), h.UploadPhoto)
	tanks.Get("/:tank_id/photos", h.GetTankPhotos)
	tanks.Put("/:tank_id/photos/reorder", middleware.JWTMiddleware(jwtSecret), h.ReorderPhotos)

	// Individual photo routes (require auth)
	photos := app.Group("/api/v1/photos")
	photos.Delete("/:photo_id", middleware.JWTMiddleware(jwtSecret), h.DeletePhoto)
	photos.Put("/:photo_id/set-primary", middleware.JWTMiddleware(jwtSecret), h.SetPrimaryPhoto)
	photos.Put("/:photo_id/caption", middleware.JWTMiddleware(jwtSecret), h.UpdateCaption)
}

// UploadPhoto godoc
// @Summary Upload a photo for a tank
// @Description Upload a photo for a tank. First photo is automatically set as primary.
// @Tags tank-photos
// @Accept multipart/form-data
// @Produce json
// @Param tank_id path string true "Tank ID"
// @Param photo formData file true "Photo file"
// @Param caption formData string false "Photo caption"
// @Param is_primary formData bool false "Set as primary photo"
// @Success 201 {object} domain.TankPhoto
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /api/v1/tanks/{tank_id}/photos [post]
func (h *TankPhotoHandler) UploadPhoto(c *fiber.Ctx) error {
	tankID := c.Params("tank_id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	// Get the uploaded file
	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Photo file is required",
		})
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to open file",
		})
	}
	defer src.Close()

	// Get optional fields
	caption := c.FormValue("caption")
	isPrimary := c.FormValue("is_primary") == "true"

	// Upload photo
	photo, err := h.photoService.UploadPhoto(c.Context(), tankID, userID, src, file, caption, isPrimary)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(photo)
}

// GetTankPhotos godoc
// @Summary Get all photos for a tank
// @Description Retrieve all photos for a specific tank
// @Tags tank-photos
// @Produce json
// @Param tank_id path string true "Tank ID"
// @Success 200 {array} domain.TankPhoto
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/tanks/{tank_id}/photos [get]
func (h *TankPhotoHandler) GetTankPhotos(c *fiber.Ctx) error {
	tankID := c.Params("tank_id")

	photos, err := h.photoService.GetTankPhotos(c.Context(), tankID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(photos)
}

// DeletePhoto godoc
// @Summary Delete a photo
// @Description Delete a photo from a tank
// @Tags tank-photos
// @Produce json
// @Param photo_id path string true "Photo ID"
// @Success 200 {object} SuccessResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /api/v1/photos/{photo_id} [delete]
func (h *TankPhotoHandler) DeletePhoto(c *fiber.Ctx) error {
	photoID := c.Params("photo_id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	err := h.photoService.DeletePhoto(c.Context(), photoID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Photo deleted successfully",
	})
}

// SetPrimaryPhoto godoc
// @Summary Set a photo as primary
// @Description Set a photo as the primary photo for a tank
// @Tags tank-photos
// @Produce json
// @Param photo_id path string true "Photo ID"
// @Success 200 {object} SuccessResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /api/v1/photos/{photo_id}/set-primary [put]
func (h *TankPhotoHandler) SetPrimaryPhoto(c *fiber.Ctx) error {
	photoID := c.Params("photo_id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	err := h.photoService.SetPrimaryPhoto(c.Context(), photoID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Primary photo updated successfully",
	})
}

// UpdateCaption godoc
// @Summary Update photo caption
// @Description Update the caption of a photo
// @Tags tank-photos
// @Accept json
// @Produce json
// @Param photo_id path string true "Photo ID"
// @Param body body UpdateCaptionRequest true "Caption"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /api/v1/photos/{photo_id}/caption [put]
func (h *TankPhotoHandler) UpdateCaption(c *fiber.Ctx) error {
	photoID := c.Params("photo_id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	var req struct {
		Caption string `json:"caption"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.photoService.UpdateCaption(c.Context(), photoID, userID, req.Caption)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Caption updated successfully",
	})
}

// ReorderPhotos godoc
// @Summary Reorder tank photos
// @Description Update the display order of photos for a tank
// @Tags tank-photos
// @Accept json
// @Produce json
// @Param tank_id path string true "Tank ID"
// @Param body body ReorderPhotosRequest true "Photo IDs in new order"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /api/v1/tanks/{tank_id}/photos/reorder [put]
func (h *TankPhotoHandler) ReorderPhotos(c *fiber.Ctx) error {
	tankID := c.Params("tank_id")
	userID := c.Locals("user_id").(uuid.UUID).String()

	var req struct {
		PhotoIDs []string `json:"photo_ids"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.photoService.ReorderPhotos(c.Context(), tankID, userID, req.PhotoIDs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Photos reordered successfully",
	})
}

type UpdateCaptionRequest struct {
	Caption string `json:"caption"`
}

type ReorderPhotosRequest struct {
	PhotoIDs []string `json:"photo_ids"`
}
