package handler

import (
	"aquabook/internal/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type FishSpeciesHandler struct {
	fishService *service.FishSpeciesService
}

func NewFishSpeciesHandler(fishService *service.FishSpeciesService) *FishSpeciesHandler {
	return &FishSpeciesHandler{fishService: fishService}
}

func (h *FishSpeciesHandler) RegisterRoutes(app *fiber.App) {
	fish := app.Group("/api/v1/fish-species")

	fish.Get("/search", h.Search)
	fish.Get("/:id", h.GetByID)
}

func (h *FishSpeciesHandler) Search(c *fiber.Ctx) error {
	query := c.Query("q", "")
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	species, err := h.fishService.Search(c.Context(), query, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to search fish species",
		})
	}

	return c.JSON(fiber.Map{
		"species": species,
	})
}

func (h *FishSpeciesHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	species, err := h.fishService.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "fish species not found",
		})
	}

	return c.JSON(fiber.Map{
		"species": species,
	})
}
