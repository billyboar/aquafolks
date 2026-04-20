package postgres

import (
	"aquabook/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TankRepository struct {
	db *pgxpool.Pool
}

func NewTankRepository(db *pgxpool.Pool) *TankRepository {
	return &TankRepository{db: db}
}

func (r *TankRepository) Create(ctx context.Context, tank *domain.Tank) error {
	query := `
		INSERT INTO tanks (id, user_id, name, description, volume_liters, dimensions_length, dimensions_width, dimensions_height, tank_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING created_at, updated_at
	`

	tank.ID = uuid.New().String()

	err := r.db.QueryRow(
		ctx,
		query,
		tank.ID,
		tank.UserID,
		tank.Name,
		tank.Description,
		tank.VolumeLiters,
		tank.DimensionsLength,
		tank.DimensionsWidth,
		tank.DimensionsHeight,
		tank.TankType,
	).Scan(&tank.CreatedAt, &tank.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create tank: %w", err)
	}

	return nil
}

func (r *TankRepository) GetByID(ctx context.Context, id string) (*domain.Tank, error) {
	query := `
		SELECT id, user_id, name, description, volume_liters, dimensions_length, dimensions_width, dimensions_height, tank_type, created_at, updated_at
		FROM tanks
		WHERE id = $1 AND deleted_at IS NULL
	`

	tank := &domain.Tank{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&tank.ID,
		&tank.UserID,
		&tank.Name,
		&tank.Description,
		&tank.VolumeLiters,
		&tank.DimensionsLength,
		&tank.DimensionsWidth,
		&tank.DimensionsHeight,
		&tank.TankType,
		&tank.CreatedAt,
		&tank.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("tank not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tank: %w", err)
	}

	return tank, nil
}

func (r *TankRepository) GetByUserID(ctx context.Context, userID string) ([]*domain.Tank, error) {
	query := `
		SELECT id, user_id, name, description, volume_liters, dimensions_length, dimensions_width, dimensions_height, tank_type, created_at, updated_at
		FROM tanks
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tanks: %w", err)
	}
	defer rows.Close()

	var tanks []*domain.Tank
	for rows.Next() {
		tank := &domain.Tank{}
		err := rows.Scan(
			&tank.ID,
			&tank.UserID,
			&tank.Name,
			&tank.Description,
			&tank.VolumeLiters,
			&tank.DimensionsLength,
			&tank.DimensionsWidth,
			&tank.DimensionsHeight,
			&tank.TankType,
			&tank.CreatedAt,
			&tank.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tank: %w", err)
		}
		tanks = append(tanks, tank)
	}

	return tanks, nil
}

func (r *TankRepository) Update(ctx context.Context, id string, input *domain.UpdateTankInput) (*domain.Tank, error) {
	query := `
		UPDATE tanks
		SET 
			name = COALESCE($2, name),
			description = COALESCE($3, description),
			volume_liters = COALESCE($4, volume_liters),
			dimensions_length = COALESCE($5, dimensions_length),
			dimensions_width = COALESCE($6, dimensions_width),
			dimensions_height = COALESCE($7, dimensions_height),
			tank_type = COALESCE($8, tank_type),
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, user_id, name, description, volume_liters, dimensions_length, dimensions_width, dimensions_height, tank_type, created_at, updated_at
	`

	tank := &domain.Tank{}
	err := r.db.QueryRow(
		ctx,
		query,
		id,
		input.Name,
		input.Description,
		input.VolumeLiters,
		input.DimensionsLength,
		input.DimensionsWidth,
		input.DimensionsHeight,
		input.TankType,
	).Scan(
		&tank.ID,
		&tank.UserID,
		&tank.Name,
		&tank.Description,
		&tank.VolumeLiters,
		&tank.DimensionsLength,
		&tank.DimensionsWidth,
		&tank.DimensionsHeight,
		&tank.TankType,
		&tank.CreatedAt,
		&tank.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("tank not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update tank: %w", err)
	}

	return tank, nil
}

func (r *TankRepository) Delete(ctx context.Context, id string) error {
	query := `
		UPDATE tanks
		SET deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete tank: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("tank not found")
	}

	return nil
}

func (r *TankRepository) List(ctx context.Context, limit, offset int) ([]*domain.Tank, error) {
	query := `
		SELECT id, user_id, name, description, volume_liters, dimensions_length, dimensions_width, dimensions_height, tank_type, created_at, updated_at
		FROM tanks
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list tanks: %w", err)
	}
	defer rows.Close()

	var tanks []*domain.Tank
	for rows.Next() {
		tank := &domain.Tank{}
		err := rows.Scan(
			&tank.ID,
			&tank.UserID,
			&tank.Name,
			&tank.Description,
			&tank.VolumeLiters,
			&tank.DimensionsLength,
			&tank.DimensionsWidth,
			&tank.DimensionsHeight,
			&tank.TankType,
			&tank.CreatedAt,
			&tank.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tank: %w", err)
		}
		tanks = append(tanks, tank)
	}

	return tanks, nil
}
