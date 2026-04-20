package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
)

type LivestockHandler struct {
	livestockService *service.LivestockService
}

func NewLivestockHandler(livestockService *service.LivestockService) *LivestockHandler {
	return &LivestockHandler{livestockService: livestockService}
}

func (h *LivestockHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	livestock := app.Group("/api/v1/tanks/:tankId/livestock")

	// Public routes
	livestock.Get("/", h.GetTankLivestock)

	// Protected routes
	livestock.Post("/", middleware.JWTMiddleware(jwtSecret), h.AddLivestock)
	livestock.Delete("/:id", middleware.JWTMiddleware(jwtSecret), h.DeleteLivestock)
}

func (h *LivestockHandler) AddLivestock(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	tankID := c.Params("tankId")

	var input domain.AddLivestockInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	livestock, err := h.livestockService.AddLivestock(c.Context(), tankID, userID.String(), &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"livestock": livestock,
	})
}

func (h *LivestockHandler) GetTankLivestock(c *fiber.Ctx) error {
	tankID := c.Params("tankId")

	livestock, err := h.livestockService.GetTankLivestock(c.Context(), tankID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch livestock",
		})
	}

	return c.JSON(fiber.Map{
		"livestock": livestock,
	})
}

func (h *LivestockHandler) DeleteLivestock(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id := c.Params("id")

	if err := h.livestockService.DeleteLivestock(c.Context(), id, userID.String()); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "livestock deleted successfully",
	})
}
