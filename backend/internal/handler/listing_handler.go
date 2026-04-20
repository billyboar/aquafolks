package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/service"
	"aquabook/pkg/storage"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ListingHandler struct {
	listingService *service.ListingService
	storage        *storage.S3Client
}

func NewListingHandler(listingService *service.ListingService, storage *storage.S3Client) *ListingHandler {
	return &ListingHandler{
		listingService: listingService,
		storage:        storage,
	}
}

func (h *ListingHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	listings := app.Group("/api/v1/marketplace")

	// Public routes
	listings.Get("/", h.GetListings)
	listings.Get("/:id", h.GetListing)

	// Protected routes
	listings.Post("/", middleware.JWTMiddleware(jwtSecret), h.CreateListing)
	listings.Put("/:id", middleware.JWTMiddleware(jwtSecret), h.UpdateListing)
	listings.Delete("/:id", middleware.JWTMiddleware(jwtSecret), h.DeleteListing)
	listings.Post("/:id/favorite", middleware.JWTMiddleware(jwtSecret), h.ToggleFavorite)
	listings.Post("/upload-photo", middleware.JWTMiddleware(jwtSecret), h.UploadPhoto)
}

// GetListings retrieves listings with filters
func (h *ListingHandler) GetListings(c *fiber.Ctx) error {
	filters := &domain.SearchListingsFilter{
		Limit:  20,
		Offset: 0,
	}

	// Parse filters from query params
	if category := c.Query("category"); category != "" {
		cat := domain.ListingCategory(category)
		filters.Category = &cat
	}

	if priceType := c.Query("price_type"); priceType != "" {
		pt := domain.ListingPriceType(priceType)
		filters.PriceType = &pt
	}

	if minPrice := c.Query("min_price"); minPrice != "" {
		if val, err := strconv.ParseFloat(minPrice, 64); err == nil {
			filters.PriceMin = &val
		}
	}

	if maxPrice := c.Query("max_price"); maxPrice != "" {
		if val, err := strconv.ParseFloat(maxPrice, 64); err == nil {
			filters.PriceMax = &val
		}
	}

	if userID := c.Query("user_id"); userID != "" {
		if id, err := uuid.Parse(userID); err == nil {
			filters.UserID = &id
		}
	}

	if lat := c.Query("lat"); lat != "" {
		if val, err := strconv.ParseFloat(lat, 64); err == nil {
			filters.Lat = &val
		}
	}

	if lng := c.Query("lng"); lng != "" {
		if val, err := strconv.ParseFloat(lng, 64); err == nil {
			filters.Lng = &val
		}
	}

	if radius := c.Query("radius_km"); radius != "" {
		if val, err := strconv.ParseFloat(radius, 64); err == nil {
			filters.RadiusKM = &val
		}
	}

	if keyword := c.Query("q"); keyword != "" {
		filters.Keyword = &keyword
	}

	if limit := c.Query("limit"); limit != "" {
		if val, err := strconv.Atoi(limit); err == nil && val > 0 && val <= 100 {
			filters.Limit = val
		}
	}

	if offset := c.Query("offset"); offset != "" {
		if val, err := strconv.Atoi(offset); err == nil && val >= 0 {
			filters.Offset = val
		}
	}

	// Get current user ID if authenticated
	var currentUserID *uuid.UUID
	if userIDVal, err := middleware.GetUserID(c); err == nil {
		currentUserID = &userIDVal
	}

	listings, err := h.listingService.SearchListings(c.Context(), filters, currentUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get listings",
		})
	}

	return c.JSON(fiber.Map{
		"listings": listings,
	})
}

// GetListing retrieves a single listing by ID
func (h *ListingHandler) GetListing(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid listing id",
		})
	}

	var currentUserID *uuid.UUID
	if userIDVal, err := middleware.GetUserID(c); err == nil {
		currentUserID = &userIDVal
	}

	listing, err := h.listingService.GetListing(c.Context(), id, currentUserID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "listing not found",
		})
	}

	return c.JSON(fiber.Map{
		"listing": listing,
	})
}

// CreateListing creates a new marketplace listing
func (h *ListingHandler) CreateListing(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var input domain.CreateListingInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	listing, err := h.listingService.CreateListing(c.Context(), &input, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"listing": listing,
	})
}

// UpdateListing updates a listing
func (h *ListingHandler) UpdateListing(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid listing id",
		})
	}

	var input domain.UpdateListingInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	listing, err := h.listingService.UpdateListing(c.Context(), id, userID, &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"listing": listing,
	})
}

// DeleteListing deletes a listing
func (h *ListingHandler) DeleteListing(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid listing id",
		})
	}

	if err := h.listingService.DeleteListing(c.Context(), id, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// ToggleFavorite toggles favorite status for a listing
func (h *ListingHandler) ToggleFavorite(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid listing id",
		})
	}

	isFavorited, err := h.listingService.ToggleFavorite(c.Context(), id, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"is_favorited": isFavorited,
	})
}

// UploadPhoto handles photo upload for listings
func (h *ListingHandler) UploadPhoto(c *fiber.Ctx) error {
	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "no file uploaded",
		})
	}

	// Validate file type and size (max 10MB for images)
	if file.Size > 10*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "file too large (max 10MB)",
		})
	}

	// Open the file
	fileData, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to process file",
		})
	}
	defer fileData.Close()

	// Upload to storage
	url, err := h.storage.UploadFile(c.Context(), fileData, file, "marketplace")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to upload photo",
		})
	}

	return c.JSON(fiber.Map{
		"photo_url": url,
	})
}
