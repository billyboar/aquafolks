package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"aquabook/internal/domain"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user in the database
func (r *UserRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (
			id, username, email, password_hash, display_name, bio, avatar_url,
			location_city, location_state, location_country, location_coords,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			ST_SetSRID(ST_MakePoint($11, $12), 4326),
			$13, $14
		)
	`

	now := time.Now()
	user.ID = uuid.New()
	user.CreatedAt = now
	user.UpdatedAt = now

	_, err := r.db.Exec(ctx, query,
		user.ID,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.DisplayName,
		user.Bio,
		user.AvatarURL,
		user.LocationCity,
		user.LocationState,
		user.LocationCountry,
		user.LocationLng, // longitude first for PostGIS
		user.LocationLat, // latitude second
		user.CreatedAt,
		user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetByID retrieves a user by their ID
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT 
			id, username, email, password_hash, display_name, bio, avatar_url,
			location_city, location_state, location_country,
			ST_X(location_coords::geometry) as longitude,
			ST_Y(location_coords::geometry) as latitude,
			role, is_banned, banned_at, banned_reason, banned_by,
			created_at, updated_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
	`

	var user domain.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.DisplayName,
		&user.Bio,
		&user.AvatarURL,
		&user.LocationCity,
		&user.LocationState,
		&user.LocationCountry,
		&user.LocationLng,
		&user.LocationLat,
		&user.Role,
		&user.IsBanned,
		&user.BannedAt,
		&user.BannedReason,
		&user.BannedBy,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetByUsername retrieves a user by their username
func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT 
			id, username, email, password_hash, display_name, bio, avatar_url,
			location_city, location_state, location_country,
			ST_X(location_coords::geometry) as longitude,
			ST_Y(location_coords::geometry) as latitude,
			role, is_banned, banned_at, banned_reason, banned_by,
			created_at, updated_at
		FROM users
		WHERE username = $1 AND deleted_at IS NULL
	`

	var user domain.User
	err := r.db.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.DisplayName,
		&user.Bio,
		&user.AvatarURL,
		&user.LocationCity,
		&user.LocationState,
		&user.LocationCountry,
		&user.LocationLng,
		&user.LocationLat,
		&user.Role,
		&user.IsBanned,
		&user.BannedAt,
		&user.BannedReason,
		&user.BannedBy,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetByEmail retrieves a user by their email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT 
			id, username, email, password_hash, display_name, bio, avatar_url,
			location_city, location_state, location_country,
			ST_X(location_coords::geometry) as longitude,
			ST_Y(location_coords::geometry) as latitude,
			role, is_banned, banned_at, banned_reason, banned_by,
			created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
	`

	var user domain.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.DisplayName,
		&user.Bio,
		&user.AvatarURL,
		&user.LocationCity,
		&user.LocationState,
		&user.LocationCountry,
		&user.LocationLng,
		&user.LocationLat,
		&user.Role,
		&user.IsBanned,
		&user.BannedAt,
		&user.BannedReason,
		&user.BannedBy,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// Update updates an existing user
func (r *UserRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users SET
			username = $2,
			email = $3,
			display_name = $4,
			bio = $5,
			avatar_url = $6,
			location_city = $7,
			location_state = $8,
			location_country = $9,
			location_coords = ST_SetSRID(ST_MakePoint($10, $11), 4326),
			updated_at = $12
		WHERE id = $1 AND deleted_at IS NULL
	`

	user.UpdatedAt = time.Now()

	result, err := r.db.Exec(ctx, query,
		user.ID,
		user.Username,
		user.Email,
		user.DisplayName,
		user.Bio,
		user.AvatarURL,
		user.LocationCity,
		user.LocationState,
		user.LocationCountry,
		user.LocationLng,
		user.LocationLat,
		user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// UpdatePassword updates a user's password hash
func (r *UserRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `
		UPDATE users SET
			password_hash = $2,
			updated_at = $3
		WHERE id = $1 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.Exec(ctx, query, userID, passwordHash, now)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// Delete soft deletes a user
func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE users 
		SET deleted_at = $2, updated_at = $2
		WHERE id = $1 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.Exec(ctx, query, id, now)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// List retrieves users with pagination
func (r *UserRepository) List(ctx context.Context, limit, offset int) ([]*domain.User, error) {
	query := `
		SELECT 
			id, username, email, password_hash, display_name, bio, avatar_url,
			location_city, location_state, location_country,
			ST_X(location_coords::geometry) as longitude,
			ST_Y(location_coords::geometry) as latitude,
			created_at, updated_at
		FROM users
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var user domain.User
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.PasswordHash,
			&user.DisplayName,
			&user.Bio,
			&user.AvatarURL,
			&user.LocationCity,
			&user.LocationState,
			&user.LocationCountry,
			&user.LocationLng,
			&user.LocationLat,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating users: %w", err)
	}

	return users, nil
}

// FindNearby finds users near a specific location within radius (in kilometers)
func (r *UserRepository) FindNearby(ctx context.Context, lat, lng float64, radiusKm int, limit int) ([]*domain.User, error) {
	query := `
		SELECT 
			id, username, email, password_hash, display_name, bio, avatar_url,
			location_city, location_state, location_country,
			ST_X(location_coords::geometry) as longitude,
			ST_Y(location_coords::geometry) as latitude,
			created_at, updated_at,
			ST_Distance(
				location_coords,
				ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
			) / 1000 as distance_km
		FROM users
		WHERE deleted_at IS NULL
		AND ST_DWithin(
			location_coords,
			ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
			$3 * 1000
		)
		ORDER BY distance_km ASC
		LIMIT $4
	`

	rows, err := r.db.Query(ctx, query, lat, lng, radiusKm, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to find nearby users: %w", err)
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var user domain.User
		var distanceKm float64
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.PasswordHash,
			&user.DisplayName,
			&user.Bio,
			&user.AvatarURL,
			&user.LocationCity,
			&user.LocationState,
			&user.LocationCountry,
			&user.LocationLng,
			&user.LocationLat,
			&user.CreatedAt,
			&user.UpdatedAt,
			&distanceKm,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating users: %w", err)
	}

	return users, nil
}
