package middleware

import (
	"aquabook/pkg/auth"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// JWTMiddleware validates JWT tokens and extracts user info
func JWTMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header format",
			})
		}

		tokenString := parts[1]

		// Validate token
		claims, err := auth.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid or expired token",
			})
		}

		// Store user info in context
		c.Locals("user_id", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("email", claims.Email)

		return c.Next()
	}
}

// GetUserID extracts the user ID from the request context
func GetUserID(c *fiber.Ctx) (uuid.UUID, error) {
	userID, ok := c.Locals("user_id").(uuid.UUID)
	if !ok {
		return uuid.Nil, fiber.NewError(fiber.StatusUnauthorized, "user not authenticated")
	}
	return userID, nil
}

// GetUsername extracts the username from the request context
func GetUsername(c *fiber.Ctx) (string, error) {
	username, ok := c.Locals("username").(string)
	if !ok {
		return "", fiber.NewError(fiber.StatusUnauthorized, "user not authenticated")
	}
	return username, nil
}
