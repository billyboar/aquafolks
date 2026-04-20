package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"aquabook/internal/domain"
)

type TankPhotoRepository struct {
	db *pgxpool.Pool
}

func NewTankPhotoRepository(db *pgxpool.Pool) *TankPhotoRepository {
	return &TankPhotoRepository{db: db}
}

// Create creates a new tank photo
func (r *TankPhotoRepository) Create(ctx context.Context, tankID string, photoURL, caption string, isPrimary bool, order int) (*domain.TankPhoto, error) {
	photo := &domain.TankPhoto{}

	query := `
		INSERT INTO tank_photos (tank_id, photo_url, caption, is_primary, display_order)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, tank_id, photo_url, caption, is_primary, display_order, created_at
	`

	err := r.db.QueryRow(ctx, query, tankID, photoURL, caption, isPrimary, order).Scan(
		&photo.ID,
		&photo.TankID,
		&photo.URL,
		&photo.Caption,
		&photo.IsPrimary,
		&photo.Order,
		&photo.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create tank photo: %w", err)
	}

	return photo, nil
}

// GetByTankID retrieves all photos for a tank
func (r *TankPhotoRepository) GetByTankID(ctx context.Context, tankID string) ([]domain.TankPhoto, error) {
	query := `
		SELECT id, tank_id, photo_url, caption, is_primary, display_order, created_at
		FROM tank_photos
		WHERE tank_id = $1 AND deleted_at IS NULL
		ORDER BY is_primary DESC, display_order ASC, created_at ASC
	`

	rows, err := r.db.Query(ctx, query, tankID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tank photos: %w", err)
	}
	defer rows.Close()

	var photos []domain.TankPhoto
	for rows.Next() {
		var photo domain.TankPhoto
		err := rows.Scan(
			&photo.ID,
			&photo.TankID,
			&photo.URL,
			&photo.Caption,
			&photo.IsPrimary,
			&photo.Order,
			&photo.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan photo: %w", err)
		}
		photos = append(photos, photo)
	}

	return photos, nil
}

// GetByID retrieves a single photo
func (r *TankPhotoRepository) GetByID(ctx context.Context, photoID string) (*domain.TankPhoto, error) {
	photo := &domain.TankPhoto{}

	query := `
		SELECT id, tank_id, photo_url, caption, is_primary, display_order, created_at
		FROM tank_photos
		WHERE id = $1 AND deleted_at IS NULL
	`

	err := r.db.QueryRow(ctx, query, photoID).Scan(
		&photo.ID,
		&photo.TankID,
		&photo.URL,
		&photo.Caption,
		&photo.IsPrimary,
		&photo.Order,
		&photo.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get photo: %w", err)
	}

	return photo, nil
}

// Delete soft deletes a photo
func (r *TankPhotoRepository) Delete(ctx context.Context, photoID string) error {
	query := `
		UPDATE tank_photos
		SET deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, photoID)
	if err != nil {
		return fmt.Errorf("failed to delete photo: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("photo not found")
	}

	return nil
}

// SetPrimary sets a photo as primary and unsets others
func (r *TankPhotoRepository) SetPrimary(ctx context.Context, photoID, tankID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Unset all primary photos for this tank
	_, err = tx.Exec(ctx, `
		UPDATE tank_photos
		SET is_primary = FALSE
		WHERE tank_id = $1 AND deleted_at IS NULL
	`, tankID)
	if err != nil {
		return fmt.Errorf("failed to unset primary photos: %w", err)
	}

	// Set this photo as primary
	_, err = tx.Exec(ctx, `
		UPDATE tank_photos
		SET is_primary = TRUE
		WHERE id = $1 AND deleted_at IS NULL
	`, photoID)
	if err != nil {
		return fmt.Errorf("failed to set primary photo: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// UpdateOrder updates the display order of a photo
func (r *TankPhotoRepository) UpdateOrder(ctx context.Context, photoID string, order int) error {
	query := `
		UPDATE tank_photos
		SET display_order = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, order, photoID)
	if err != nil {
		return fmt.Errorf("failed to update photo order: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("photo not found")
	}

	return nil
}

// UpdateCaption updates the caption of a photo
func (r *TankPhotoRepository) UpdateCaption(ctx context.Context, photoID, caption string) error {
	query := `
		UPDATE tank_photos
		SET caption = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, caption, photoID)
	if err != nil {
		return fmt.Errorf("failed to update photo caption: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("photo not found")
	}

	return nil
}

// GetPrimaryPhoto retrieves the primary photo for a tank
func (r *TankPhotoRepository) GetPrimaryPhoto(ctx context.Context, tankID string) (*domain.TankPhoto, error) {
	photo := &domain.TankPhoto{}

	query := `
		SELECT id, tank_id, photo_url, caption, is_primary, display_order, created_at
		FROM tank_photos
		WHERE tank_id = $1 AND is_primary = TRUE AND deleted_at IS NULL
		LIMIT 1
	`

	err := r.db.QueryRow(ctx, query, tankID).Scan(
		&photo.ID,
		&photo.TankID,
		&photo.URL,
		&photo.Caption,
		&photo.IsPrimary,
		&photo.Order,
		&photo.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get primary photo: %w", err)
	}

	return photo, nil
}
