package middleware

import (
	"aquabook/internal/domain"
	"aquabook/internal/repository"

	"github.com/gofiber/fiber/v2"
)

// RequireAdmin middleware ensures the user has admin role
func RequireAdmin(userRepo repository.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, err := GetUserID(c)
		if err != nil {
			return err
		}

		// Fetch user from database to check role
		user, err := userRepo.GetByID(c.Context(), userID)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "user not found",
			})
		}

		// Check if user is banned
		if user.IsBanned != nil && *user.IsBanned {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "account is banned",
			})
		}

		// Check if user has admin role
		if user.Role == nil || *user.Role != domain.RoleAdmin {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "admin access required",
			})
		}

		// Store user object in context for handler use
		c.Locals("user", user)

		return c.Next()
	}
}

// RequireModerator middleware ensures the user has moderator or admin role
func RequireModerator(userRepo repository.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, err := GetUserID(c)
		if err != nil {
			return err
		}

		// Fetch user from database to check role
		user, err := userRepo.GetByID(c.Context(), userID)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "user not found",
			})
		}

		// Check if user is banned
		if user.IsBanned != nil && *user.IsBanned {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "account is banned",
			})
		}

		// Check if user has moderator or admin role
		if user.Role == nil || (*user.Role != domain.RoleModerator && *user.Role != domain.RoleAdmin) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "moderator or admin access required",
			})
		}

		// Store user object in context for handler use
		c.Locals("user", user)

		return c.Next()
	}
}

// GetUserFromContext retrieves the user object from context (set by admin/moderator middleware)
func GetUserFromContext(c *fiber.Ctx) (*domain.User, error) {
	user, ok := c.Locals("user").(*domain.User)
	if !ok {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "user not in context")
	}
	return user, nil
}
