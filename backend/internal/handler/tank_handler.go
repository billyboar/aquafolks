package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type TankHandler struct {
	tankService *service.TankService
}

func NewTankHandler(tankService *service.TankService) *TankHandler {
	return &TankHandler{tankService: tankService}
}

func (h *TankHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	tanks := app.Group("/api/v1/tanks")

	// Public routes
	tanks.Get("/", h.ListTanks)
	tanks.Get("/:id", h.GetTank)

	// Protected routes
	tanks.Post("/", middleware.JWTMiddleware(jwtSecret), h.CreateTank)
	tanks.Put("/:id", middleware.JWTMiddleware(jwtSecret), h.UpdateTank)
	tanks.Delete("/:id", middleware.JWTMiddleware(jwtSecret), h.DeleteTank)
	tanks.Get("/user/:userId", h.GetUserTanks)
}

func (h *TankHandler) CreateTank(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var input domain.CreateTankInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	tank, err := h.tankService.CreateTank(c.Context(), userID.String(), &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"tank": tank,
	})
}

func (h *TankHandler) GetTank(c *fiber.Ctx) error {
	id := c.Params("id")

	tank, err := h.tankService.GetTank(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "tank not found",
		})
	}

	return c.JSON(fiber.Map{
		"tank": tank,
	})
}

func (h *TankHandler) GetUserTanks(c *fiber.Ctx) error {
	userID := c.Params("userId")

	tanks, err := h.tankService.GetUserTanks(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch tanks",
		})
	}

	return c.JSON(fiber.Map{
		"tanks": tanks,
	})
}

func (h *TankHandler) UpdateTank(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id := c.Params("id")

	var input domain.UpdateTankInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	tank, err := h.tankService.UpdateTank(c.Context(), id, userID.String(), &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"tank": tank,
	})
}

func (h *TankHandler) DeleteTank(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id := c.Params("id")

	if err := h.tankService.DeleteTank(c.Context(), id, userID.String()); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "tank deleted successfully",
	})
}

func (h *TankHandler) ListTanks(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	userID := c.Query("user_id")

	// If user_id is provided, return that user's tanks
	if userID != "" {
		tanks, err := h.tankService.GetUserTanks(c.Context(), userID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to fetch tanks",
			})
		}
		return c.JSON(fiber.Map{
			"tanks": tanks,
		})
	}

	// Otherwise, return all tanks with pagination
	tanks, err := h.tankService.ListTanks(c.Context(), limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch tanks",
		})
	}

	return c.JSON(fiber.Map{
		"tanks": tanks,
	})
}
