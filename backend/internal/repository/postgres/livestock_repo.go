package postgres

import (
	"aquabook/internal/domain"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LivestockRepository struct {
	db *pgxpool.Pool
}

func NewLivestockRepository(db *pgxpool.Pool) *LivestockRepository {
	return &LivestockRepository{db: db}
}

func (r *LivestockRepository) Create(ctx context.Context, livestock *domain.Livestock) error {
	query := `
		INSERT INTO livestock (id, tank_id, fish_species_id, name, scientific_name, category, quantity, added_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
		RETURNING created_at
	`

	livestock.ID = uuid.New().String()

	err := r.db.QueryRow(
		ctx,
		query,
		livestock.ID,
		livestock.TankID,
		livestock.FishSpeciesID,
		livestock.CommonName,
		livestock.ScientificName,
		livestock.Type,
		livestock.Quantity,
	).Scan(&livestock.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create livestock: %w", err)
	}

	return nil
}

func (r *LivestockRepository) GetByTankID(ctx context.Context, tankID string) ([]*domain.Livestock, error) {
	query := `
		SELECT l.id, l.tank_id, l.fish_species_id, l.name, l.scientific_name, 
		       l.category, l.quantity, l.created_at,
		       fs.id, fs.common_name, fs.scientific_name, fs.category, fs.type,
		       fs.min_tank_size_liters, fs.max_size_cm, fs.temperament, fs.care_level, fs.diet,
		       fs.created_at, fs.updated_at
		FROM livestock l
		LEFT JOIN fish_species fs ON l.fish_species_id = fs.id
		WHERE l.tank_id = $1 AND l.deleted_at IS NULL
		ORDER BY l.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, tankID)
	if err != nil {
		return nil, fmt.Errorf("failed to get livestock: %w", err)
	}
	defer rows.Close()

	var livestocks []*domain.Livestock
	for rows.Next() {
		livestock := &domain.Livestock{}
		var fishSpecies domain.FishSpecies
		var fishSpeciesID *string

		err := rows.Scan(
			&livestock.ID,
			&livestock.TankID,
			&livestock.FishSpeciesID,
			&livestock.CommonName,
			&livestock.ScientificName,
			&livestock.Type,
			&livestock.Quantity,
			&livestock.CreatedAt,
			// Fish species fields (nullable)
			&fishSpeciesID,
			&fishSpecies.CommonName,
			&fishSpecies.ScientificName,
			&fishSpecies.Category,
			&fishSpecies.Type,
			&fishSpecies.MinTankSizeLiters,
			&fishSpecies.MaxSizeCm,
			&fishSpecies.Temperament,
			&fishSpecies.CareLevel,
			&fishSpecies.Diet,
			&fishSpecies.CreatedAt,
			&fishSpecies.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan livestock: %w", err)
		}

		// If fish species exists, attach it
		if fishSpeciesID != nil {
			fishSpecies.ID = *fishSpeciesID
			livestock.FishSpecies = &fishSpecies
		}

		livestocks = append(livestocks, livestock)
	}

	return livestocks, nil
}

func (r *LivestockRepository) Delete(ctx context.Context, id string) error {
	query := `
		UPDATE livestock
		SET deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete livestock: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("livestock not found")
	}

	return nil
}

func (r *LivestockRepository) GetByID(ctx context.Context, id string) (*domain.Livestock, error) {
	query := `
		SELECT id, tank_id, fish_species_id, name, scientific_name, category, quantity, created_at
		FROM livestock
		WHERE id = $1 AND deleted_at IS NULL
	`

	livestock := &domain.Livestock{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&livestock.ID,
		&livestock.TankID,
		&livestock.FishSpeciesID,
		&livestock.CommonName,
		&livestock.ScientificName,
		&livestock.Type,
		&livestock.Quantity,
		&livestock.CreatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("livestock not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get livestock: %w", err)
	}

	return livestock, nil
}
