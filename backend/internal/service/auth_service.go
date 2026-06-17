package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"aquabook/internal/domain"
	"aquabook/internal/repository"
	"aquabook/internal/repository/postgres"
	"aquabook/pkg/auth"
)

type AuthService struct {
	userRepo        repository.UserRepository
	resetTokenRepo  repository.PasswordResetRepository
	oauthRepo       *postgres.OAuthRepository
	emailService    *EmailService
	jwtSecret       string
	frontendBaseURL string
}

func NewAuthService(userRepo repository.UserRepository, resetTokenRepo repository.PasswordResetRepository, oauthRepo *postgres.OAuthRepository, emailService *EmailService, jwtSecret, frontendBaseURL string) *AuthService {
	return &AuthService{
		userRepo:        userRepo,
		resetTokenRepo:  resetTokenRepo,
		oauthRepo:       oauthRepo,
		emailService:    emailService,
		jwtSecret:       jwtSecret,
		frontendBaseURL: frontendBaseURL,
	}
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, input *domain.CreateUserInput) (*domain.User, *auth.TokenPair, error) {
	// Normalize email to lowercase
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))

	// Check if username already exists
	existingUser, _ := s.userRepo.GetByUsername(ctx, input.Username)
	if existingUser != nil {
		return nil, nil, fmt.Errorf("username already taken")
	}

	// Check if email already exists
	existingUser, _ = s.userRepo.GetByEmail(ctx, input.Email)
	if existingUser != nil {
		return nil, nil, fmt.Errorf("email already registered")
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(input.Password)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &domain.User{
		Username:        input.Username,
		Email:           input.Email,
		PasswordHash:    hashedPassword,
		DisplayName:     input.DisplayName,
		LocationLat:     &input.LocationLat,
		LocationLng:     &input.LocationLng,
		LocationCity:    &input.LocationCity,
		LocationState:   &input.LocationState,
		LocationCountry: &input.LocationCountry,
	}

	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate tokens
	tokens, err := auth.GenerateTokenPair(user.ID, user.Username, user.Email, s.jwtSecret)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return user, tokens, nil
}

// Login authenticates a user and returns tokens
func (s *AuthService) Login(ctx context.Context, emailOrUsername, password string) (*domain.User, *auth.TokenPair, error) {
	// Normalize input (trim whitespace, lowercase if email)
	emailOrUsername = strings.TrimSpace(emailOrUsername)

	// Try to find user by email first, then username
	var user *domain.User
	var err error

	// If it looks like an email (contains @), normalize to lowercase
	if strings.Contains(emailOrUsername, "@") {
		emailOrUsername = strings.ToLower(emailOrUsername)
	}

	user, err = s.userRepo.GetByEmail(ctx, emailOrUsername)
	if err != nil {
		// Try username
		user, err = s.userRepo.GetByUsername(ctx, emailOrUsername)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid credentials")
		}
	}

	// Check password
	err = auth.CheckPassword(user.PasswordHash, password)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	// Generate tokens
	tokens, err := auth.GenerateTokenPair(user.ID, user.Username, user.Email, s.jwtSecret)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return user, tokens, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

// UpdateUser updates user information
func (s *AuthService) UpdateUser(ctx context.Context, userID uuid.UUID, input *domain.UpdateUserInput) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Update fields if provided
	if input.DisplayName != nil {
		user.DisplayName = *input.DisplayName
	}
	if input.Bio != nil {
		user.Bio = input.Bio
	}
	if input.AvatarURL != nil {
		user.AvatarURL = input.AvatarURL
	}
	if input.LocationLat != nil {
		user.LocationLat = input.LocationLat
	}
	if input.LocationLng != nil {
		user.LocationLng = input.LocationLng
	}
	if input.LocationCity != nil {
		user.LocationCity = input.LocationCity
	}
	if input.LocationState != nil {
		user.LocationState = input.LocationState
	}
	if input.LocationCountry != nil {
		user.LocationCountry = input.LocationCountry
	}

	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return user, nil
}

// ForgotPassword generates a password reset token and sends an email
func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	// Normalize email
	email = strings.ToLower(strings.TrimSpace(email))

	// Find user by email
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		// Don't reveal if email exists or not for security
		return nil
	}

	// Delete any existing reset tokens for this user
	_ = s.resetTokenRepo.DeleteByUserID(ctx, user.ID)

	// Generate a secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}
	token := hex.EncodeToString(tokenBytes)

	// Create reset token record (expires in 1 hour)
	resetToken := &domain.PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}

	err = s.resetTokenRepo.Create(ctx, resetToken)
	if err != nil {
		return fmt.Errorf("failed to create reset token: %w", err)
	}

	// Send email with reset link
	err = s.emailService.SendPasswordResetEmail(user.Email, token, s.frontendBaseURL)
	if err != nil {
		return fmt.Errorf("failed to send reset email: %w", err)
	}

	return nil
}

// LoginWithOAuth finds or creates a user via OAuth provider and returns tokens
func (s *AuthService) LoginWithOAuth(ctx context.Context, provider, providerID, email, displayName, avatarURL string) (*domain.User, *auth.TokenPair, error) {
	// Check if oauth account already exists
	oauthAcc, err := s.oauthRepo.GetByProvider(ctx, provider, providerID)
	if err == nil {
		// Existing oauth account - load user
		user, err := s.userRepo.GetByID(ctx, oauthAcc.UserID)
		if err != nil {
			return nil, nil, fmt.Errorf("user not found for oauth account")
		}
		tokens, err := auth.GenerateTokenPair(user.ID, user.Username, user.Email, s.jwtSecret)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to generate tokens: %w", err)
		}
		return user, tokens, nil
	}

	// Check if user with this email already exists (link accounts)
	var user *domain.User
	if email != "" {
		user, _ = s.userRepo.GetByEmail(ctx, strings.ToLower(email))
	}

	if user == nil {
		// Create new user
		username := generateUsernameFromProvider(provider, providerID)
		if displayName == "" {
			displayName = username
		}
		newUser := &domain.User{
			Username:    username,
			Email:       strings.ToLower(email),
			DisplayName: displayName,
		}
		if avatarURL != "" {
			newUser.AvatarURL = &avatarURL
		}
		if err := s.userRepo.Create(ctx, newUser); err != nil {
			return nil, nil, fmt.Errorf("failed to create user: %w", err)
		}
		user = newUser
	}

	// Create oauth account record
	emailPtr := (*string)(nil)
	if email != "" {
		emailPtr = &email
	}
	acc := &domain.OAuthAccount{
		UserID:     user.ID,
		Provider:   provider,
		ProviderID: providerID,
		Email:      emailPtr,
	}
	if err := s.oauthRepo.Create(ctx, acc); err != nil {
		return nil, nil, fmt.Errorf("failed to link oauth account: %w", err)
	}

	tokens, err := auth.GenerateTokenPair(user.ID, user.Username, user.Email, s.jwtSecret)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return user, tokens, nil
}

func generateUsernameFromProvider(provider, providerID string) string {
	short := providerID
	if len(short) > 8 {
		short = short[:8]
	}
	return provider + "_" + short
}

// ResetPassword resets a user's password using a valid token
func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// Get reset token
	resetToken, err := s.resetTokenRepo.GetByToken(ctx, token)
	if err != nil {
		return fmt.Errorf("invalid or expired reset token")
	}

	// Check if token is expired
	if time.Now().After(resetToken.ExpiresAt) {
		return fmt.Errorf("reset token has expired")
	}

	// Check if token has already been used
	if resetToken.UsedAt != nil {
		return fmt.Errorf("reset token has already been used")
	}

	// Get user
	user, err := s.userRepo.GetByID(ctx, resetToken.UserID)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	// Hash new password
	hashedPassword, err := auth.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update user password
	err = s.userRepo.UpdatePassword(ctx, user.ID, hashedPassword)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Mark token as used
	err = s.resetTokenRepo.MarkAsUsed(ctx, resetToken.ID)
	if err != nil {
		return fmt.Errorf("failed to mark token as used: %w", err)
	}

	return nil
}
