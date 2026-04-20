package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/service"
	"aquabook/pkg/storage"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ProjectHandler struct {
	projectService *service.ProjectService
	storage        *storage.S3Client
}

func NewProjectHandler(projectService *service.ProjectService, storage *storage.S3Client) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
		storage:        storage,
	}
}

func (h *ProjectHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	projects := app.Group("/api/v1/projects")

	// Public routes
	projects.Get("/", h.GetProjects)
	projects.Get("/:id", h.GetProject)
	projects.Get("/:id/updates", h.GetProjectUpdates)

	// Protected routes
	projects.Post("/", middleware.JWTMiddleware(jwtSecret), h.CreateProject)
	projects.Put("/:id", middleware.JWTMiddleware(jwtSecret), h.UpdateProject)
	projects.Delete("/:id", middleware.JWTMiddleware(jwtSecret), h.DeleteProject)
	projects.Post("/:id/updates", middleware.JWTMiddleware(jwtSecret), h.CreateProjectUpdate)
	projects.Delete("/updates/:id", middleware.JWTMiddleware(jwtSecret), h.DeleteProjectUpdate)
	projects.Post("/upload-media", middleware.JWTMiddleware(jwtSecret), h.UploadMedia)
}

// GetProjects returns all projects with optional filters
func (h *ProjectHandler) GetProjects(c *fiber.Ctx) error {
	filters := make(map[string]interface{})

	if projectType := c.Query("project_type"); projectType != "" {
		filters["project_type"] = projectType
	}

	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	if userID := c.Query("user_id"); userID != "" {
		if uid, err := uuid.Parse(userID); err == nil {
			filters["user_id"] = uid
		}
	}

	projects, err := h.projectService.GetProjects(c.Context(), filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get projects",
		})
	}

	return c.JSON(fiber.Map{
		"projects": projects,
	})
}

// GetProject returns a single project by ID
func (h *ProjectHandler) GetProject(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project id",
		})
	}

	project, err := h.projectService.GetProject(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "project not found",
		})
	}

	return c.JSON(fiber.Map{
		"project": project,
	})
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var input domain.CreateProjectInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	project, err := h.projectService.CreateProject(c.Context(), userID, &input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to create project",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"project": project,
	})
}

// UpdateProject updates an existing project
func (h *ProjectHandler) UpdateProject(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project id",
		})
	}

	var input domain.UpdateProjectInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	project, err := h.projectService.UpdateProject(c.Context(), id, userID, &input)
	if err != nil {
		if err == domain.ErrUnauthorized {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "you don't have permission to update this project",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update project",
		})
	}

	return c.JSON(fiber.Map{
		"project": project,
	})
}

// DeleteProject deletes a project
func (h *ProjectHandler) DeleteProject(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project id",
		})
	}

	err = h.projectService.DeleteProject(c.Context(), id, userID)
	if err != nil {
		if err == domain.ErrUnauthorized {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "you don't have permission to delete this project",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to delete project",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// GetProjectUpdates returns all updates for a project
func (h *ProjectHandler) GetProjectUpdates(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project id",
		})
	}

	updates, err := h.projectService.GetProjectUpdates(c.Context(), projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get project updates",
		})
	}

	return c.JSON(fiber.Map{
		"updates": updates,
	})
}

// CreateProjectUpdate creates a new project update
func (h *ProjectHandler) CreateProjectUpdate(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid project id",
		})
	}

	var input domain.CreateProjectUpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	update, err := h.projectService.CreateProjectUpdate(c.Context(), projectID, userID, &input)
	if err != nil {
		if err == domain.ErrUnauthorized {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "you don't have permission to add updates to this project",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to create project update",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"update": update,
	})
}

// DeleteProjectUpdate deletes a project update
func (h *ProjectHandler) DeleteProjectUpdate(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	updateID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid update id",
		})
	}

	err = h.projectService.DeleteProjectUpdate(c.Context(), updateID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to delete project update",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// UploadMedia uploads a media file (image or video) for project updates
func (h *ProjectHandler) UploadMedia(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID).String()

	// Get the uploaded file
	file, err := c.FormFile("media")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Media file is required",
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

	// Validate file type (image or video)
	contentType := file.Header.Get("Content-Type")
	var mediaType string
	if strings.HasPrefix(contentType, "image/") {
		mediaType = "image"
	} else if strings.HasPrefix(contentType, "video/") {
		mediaType = "video"
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid file type: must be an image or video",
		})
	}

	// Validate file size (max 50MB for videos, 10MB for images)
	maxSize := int64(10 * 1024 * 1024) // 10MB default
	if mediaType == "video" {
		maxSize = int64(50 * 1024 * 1024) // 50MB for videos
	}
	if file.Size > maxSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("File too large: max %dMB", maxSize/(1024*1024)),
		})
	}

	// Upload to storage
	mediaURL, err := h.storage.UploadFile(c.Context(), src, file, fmt.Sprintf("projects/%s", userID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to upload media",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"media_url":  mediaURL,
		"media_type": mediaType,
	})
}
