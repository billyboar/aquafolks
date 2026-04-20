package handler

import (
	"strconv"

	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/repository"
	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AdminHandler struct {
	adminService *service.AdminService
}

func NewAdminHandler(adminService *service.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

// RegisterRoutes registers all admin routes
func (h *AdminHandler) RegisterRoutes(app *fiber.App, jwtSecret string, userRepo repository.UserRepository) {
	admin := app.Group("/api/v1/admin")

	// Apply JWT middleware to all admin routes
	admin.Use(middleware.JWTMiddleware(jwtSecret))

	// Dashboard - requires moderator or admin
	admin.Get("/stats", middleware.RequireModerator(userRepo), h.GetStats)

	// Reports - requires moderator or admin
	admin.Get("/reports", middleware.RequireModerator(userRepo), h.ListReports)
	admin.Get("/reports/:id", middleware.RequireModerator(userRepo), h.GetReport)
	admin.Put("/reports/:id", middleware.RequireModerator(userRepo), h.UpdateReport)

	// Users - requires admin
	admin.Get("/users", middleware.RequireAdmin(userRepo), h.ListUsers)
	admin.Put("/users/:id/role", middleware.RequireAdmin(userRepo), h.UpdateUserRole)

	// Moderation actions - requires moderator or admin (ban requires admin in service)
	admin.Post("/users/:id/ban", middleware.RequireModerator(userRepo), h.BanUser)
	admin.Delete("/users/:id/ban", middleware.RequireModerator(userRepo), h.UnbanUser)
	admin.Post("/users/:id/suspend", middleware.RequireModerator(userRepo), h.SuspendUser)

	// Moderation logs - requires moderator or admin
	admin.Get("/logs", middleware.RequireModerator(userRepo), h.ListLogs)

	// Public report creation endpoint (authenticated users only)
	reports := app.Group("/api/v1/reports")
	reports.Use(middleware.JWTMiddleware(jwtSecret))
	reports.Post("/", h.CreateReport)
}

// GetStats returns admin dashboard statistics
func (h *AdminHandler) GetStats(c *fiber.Ctx) error {
	stats, err := h.adminService.GetDashboardStats(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(stats)
}

// CreateReport creates a new content report
func (h *AdminHandler) CreateReport(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	var input domain.CreateReportInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	report, err := h.adminService.CreateReport(c.Context(), userID, &input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(report)
}

// ListReports returns a paginated list of reports
func (h *AdminHandler) ListReports(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	status := c.Query("status")

	var statusPtr *domain.ReportStatus
	if status != "" {
		s := domain.ReportStatus(status)
		statusPtr = &s
	}

	reports, total, err := h.adminService.ListReports(c.Context(), statusPtr, page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"reports": reports,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

// GetReport returns a single report by ID
func (h *AdminHandler) GetReport(c *fiber.Ctx) error {
	reportID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid report ID",
		})
	}

	report, err := h.adminService.GetReport(c.Context(), reportID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(report)
}

// UpdateReport updates a report (resolve, dismiss, etc.)
func (h *AdminHandler) UpdateReport(c *fiber.Ctx) error {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		return err
	}

	reportID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid report ID",
		})
	}

	var input domain.UpdateReportInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err = h.adminService.UpdateReport(c.Context(), reportID, user.ID, &input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "report updated successfully",
	})
}

// ListUsers returns a paginated list of users with filters
func (h *AdminHandler) ListUsers(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	role := c.Query("role")
	banned := c.Query("banned")
	search := c.Query("search")

	// Build filters map
	filters := make(map[string]interface{})
	if role != "" {
		filters["role"] = role
	}
	if banned == "true" {
		filters["banned"] = true
	} else if banned == "false" {
		filters["banned"] = false
	}
	if search != "" {
		filters["search"] = search
	}

	users, total, err := h.adminService.ListUsers(c.Context(), page, limit, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// UpdateUserRole updates a user's role
func (h *AdminHandler) UpdateUserRole(c *fiber.Ctx) error {
	admin, err := middleware.GetUserFromContext(c)
	if err != nil {
		return err
	}

	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	var input struct {
		Role domain.UserRole `json:"role" validate:"required"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err = h.adminService.UpdateUserRole(c.Context(), admin.ID, userID, input.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "user role updated successfully",
	})
}

// BanUser permanently bans a user
func (h *AdminHandler) BanUser(c *fiber.Ctx) error {
	admin, err := middleware.GetUserFromContext(c)
	if err != nil {
		return err
	}

	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	var input struct {
		Reason string `json:"reason" validate:"required"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	banInput := &domain.BanUserInput{
		UserID: userID,
		Reason: input.Reason,
	}

	err = h.adminService.BanUser(c.Context(), admin.ID, banInput)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "user banned successfully",
	})
}

// UnbanUser removes a ban from a user
func (h *AdminHandler) UnbanUser(c *fiber.Ctx) error {
	admin, err := middleware.GetUserFromContext(c)
	if err != nil {
		return err
	}

	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	err = h.adminService.UnbanUser(c.Context(), admin.ID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "user unbanned successfully",
	})
}

// SuspendUser creates a temporary suspension
func (h *AdminHandler) SuspendUser(c *fiber.Ctx) error {
	moderator, err := middleware.GetUserFromContext(c)
	if err != nil {
		return err
	}

	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	var input domain.CreateSuspensionInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Set UserID from path parameter
	input.UserID = userID

	err = h.adminService.SuspendUser(c.Context(), moderator.ID, &input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "user suspended successfully",
	})
}

// ListLogs returns moderation action logs
func (h *AdminHandler) ListLogs(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	logs, total, err := h.adminService.ListModerationLogs(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"logs":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
