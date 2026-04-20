package postgres

import (
	"aquabook/internal/domain"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type FishSpeciesRepository struct {
	db *pgxpool.Pool
}

func NewFishSpeciesRepository(db *pgxpool.Pool) *FishSpeciesRepository {
	return &FishSpeciesRepository{db: db}
}

func (r *FishSpeciesRepository) Search(ctx context.Context, query string, limit int) ([]*domain.FishSpecies, error) {
	sqlQuery := `
		SELECT id, common_name, scientific_name, category, type,
		       min_tank_size_liters, max_size_cm, temperament, care_level, diet,
		       created_at, updated_at
		FROM fish_species
		WHERE 
			LOWER(common_name) LIKE LOWER($1) OR
			LOWER(scientific_name) LIKE LOWER($1)
		ORDER BY common_name
		LIMIT $2
	`

	searchPattern := "%" + query + "%"
	rows, err := r.db.Query(ctx, sqlQuery, searchPattern, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search fish species: %w", err)
	}
	defer rows.Close()

	var species []*domain.FishSpecies
	for rows.Next() {
		sp := &domain.FishSpecies{}
		err := rows.Scan(
			&sp.ID,
			&sp.CommonName,
			&sp.ScientificName,
			&sp.Category,
			&sp.Type,
			&sp.MinTankSizeLiters,
			&sp.MaxSizeCm,
			&sp.Temperament,
			&sp.CareLevel,
			&sp.Diet,
			&sp.CreatedAt,
			&sp.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan fish species: %w", err)
		}
		species = append(species, sp)
	}

	return species, nil
}

func (r *FishSpeciesRepository) GetByID(ctx context.Context, id string) (*domain.FishSpecies, error) {
	query := `
		SELECT id, common_name, scientific_name, category, type,
		       min_tank_size_liters, max_size_cm, temperament, care_level, diet,
		       created_at, updated_at
		FROM fish_species
		WHERE id = $1
	`

	sp := &domain.FishSpecies{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&sp.ID,
		&sp.CommonName,
		&sp.ScientificName,
		&sp.Category,
		&sp.Type,
		&sp.MinTankSizeLiters,
		&sp.MaxSizeCm,
		&sp.Temperament,
		&sp.CareLevel,
		&sp.Diet,
		&sp.CreatedAt,
		&sp.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get fish species: %w", err)
	}

	return sp, nil
}
