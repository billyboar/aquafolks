package handler

import (
	"aquabook/internal/domain"
	"aquabook/internal/middleware"
	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// RegisterRoutes registers all auth routes
func (h *AuthHandler) RegisterRoutes(app *fiber.App, jwtSecret string) {
	auth := app.Group("/api/auth")

	auth.Post("/register", h.Register)
	auth.Post("/login", h.Login)
	auth.Post("/forgot-password", h.ForgotPassword)
	auth.Post("/reset-password", h.ResetPassword)
	auth.Get("/me", middleware.JWTMiddleware(jwtSecret), h.GetMe)
	auth.Put("/me", middleware.JWTMiddleware(jwtSecret), h.UpdateMe)

	// User profile routes
	users := app.Group("/api/v1/users")
	users.Get("/:id", h.GetUserByID)
}

// Register handles user registration
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var input domain.CreateUserInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	user, tokens, err := h.authService.Register(c.Context(), &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"user":   user,
		"tokens": tokens,
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input struct {
		EmailOrUsername string `json:"email_or_username" validate:"required"`
		Password        string `json:"password" validate:"required"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	user, tokens, err := h.authService.Login(c.Context(), input.EmailOrUsername, input.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"user":   user,
		"tokens": tokens,
	})
}

// GetMe returns the current user's profile
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	user, err := h.authService.GetUserByID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "user not found",
		})
	}

	return c.JSON(fiber.Map{
		"user": user,
	})
}

// UpdateMe updates the current user's profile
func (h *AuthHandler) UpdateMe(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var input domain.UpdateUserInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	user, err := h.authService.UpdateUser(c.Context(), userID, &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"user": user,
	})
}

// GetUserByID returns a user's public profile by ID
func (h *AuthHandler) GetUserByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user id",
		})
	}

	user, err := h.authService.GetUserByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "user not found",
		})
	}

	return c.JSON(fiber.Map{
		"user": user,
	})
}

// ForgotPassword handles password reset request
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var input domain.ForgotPasswordInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err := h.authService.ForgotPassword(c.Context(), input.Email)
	if err != nil {
		// Log the error but don't reveal details to user for security
		return c.JSON(fiber.Map{
			"message": "If the email exists, a password reset link has been sent",
		})
	}

	return c.JSON(fiber.Map{
		"message": "If the email exists, a password reset link has been sent",
	})
}

// ResetPassword handles password reset with token
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var input domain.ResetPasswordInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err := h.authService.ResetPassword(c.Context(), input.Token, input.NewPassword)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password reset successful",
	})
}
