package postgres

import (
	"aquabook/internal/domain"
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProjectRepository struct {
	db *pgxpool.Pool
}

func NewProjectRepository(db *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) Create(ctx context.Context, project *domain.Project) error {
	query := `
		INSERT INTO projects (id, user_id, tank_id, title, description, project_type, status, start_date, end_date, cover_photo_url, is_public)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at
	`

	return r.db.QueryRow(
		ctx, query,
		project.ID, project.UserID, project.TankID, project.Title, project.Description,
		project.ProjectType, project.Status, project.StartDate, project.EndDate,
		project.CoverPhotoURL, project.IsPublic,
	).Scan(&project.CreatedAt, &project.UpdatedAt)
}

func (r *ProjectRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	query := `
		SELECT id, user_id, tank_id, title, description, project_type, status, 
		       start_date, end_date, cover_photo_url, is_public, created_at, updated_at
		FROM projects
		WHERE id = $1
	`

	project := &domain.Project{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&project.ID, &project.UserID, &project.TankID, &project.Title, &project.Description,
		&project.ProjectType, &project.Status, &project.StartDate, &project.EndDate,
		&project.CoverPhotoURL, &project.IsPublic, &project.CreatedAt, &project.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return project, nil
}

func (r *ProjectRepository) FindAll(ctx context.Context, filters map[string]interface{}) ([]*domain.Project, error) {
	query := `
		SELECT id, user_id, tank_id, title, description, project_type, status,
		       start_date, end_date, cover_photo_url, is_public, created_at, updated_at
		FROM projects
		WHERE 1=1
	`
	args := []interface{}{}
	argPos := 1

	// Add filters
	if projectType, ok := filters["project_type"].(string); ok && projectType != "" {
		query += ` AND project_type = $` + string(rune(argPos+'0'))
		args = append(args, projectType)
		argPos++
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		query += ` AND status = $` + string(rune(argPos+'0'))
		args = append(args, status)
		argPos++
	}

	if userID, ok := filters["user_id"].(uuid.UUID); ok {
		query += ` AND user_id = $` + string(rune(argPos+'0'))
		args = append(args, userID)
		argPos++
	}

	// Only show public projects unless filtering by user_id
	if _, hasUserID := filters["user_id"]; !hasUserID {
		query += ` AND is_public = true`
	}

	query += ` ORDER BY created_at DESC LIMIT 100`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := []*domain.Project{}
	for rows.Next() {
		project := &domain.Project{}
		err := rows.Scan(
			&project.ID, &project.UserID, &project.TankID, &project.Title, &project.Description,
			&project.ProjectType, &project.Status, &project.StartDate, &project.EndDate,
			&project.CoverPhotoURL, &project.IsPublic, &project.CreatedAt, &project.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		projects = append(projects, project)
	}

	return projects, nil
}

func (r *ProjectRepository) Update(ctx context.Context, project *domain.Project) error {
	query := `
		UPDATE projects
		SET title = $1, description = $2, project_type = $3, status = $4,
		    start_date = $5, end_date = $6, cover_photo_url = $7, is_public = $8
		WHERE id = $9
		RETURNING updated_at
	`

	return r.db.QueryRow(
		ctx, query,
		project.Title, project.Description, project.ProjectType, project.Status,
		project.StartDate, project.EndDate, project.CoverPhotoURL, project.IsPublic,
		project.ID,
	).Scan(&project.UpdatedAt)
}

func (r *ProjectRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM projects WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// Project Updates

func (r *ProjectRepository) CreateUpdate(ctx context.Context, update *domain.ProjectUpdate) error {
	query := `
		INSERT INTO project_updates (id, project_id, title, content)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at
	`

	return r.db.QueryRow(
		ctx, query,
		update.ID, update.ProjectID, update.Title, update.Content,
	).Scan(&update.CreatedAt, &update.UpdatedAt)
}

func (r *ProjectRepository) FindUpdatesByProjectID(ctx context.Context, projectID uuid.UUID) ([]*domain.ProjectUpdate, error) {
	query := `
		SELECT id, project_id, title, content, created_at, updated_at
		FROM project_updates
		WHERE project_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	updates := []*domain.ProjectUpdate{}
	for rows.Next() {
		update := &domain.ProjectUpdate{}
		err := rows.Scan(
			&update.ID, &update.ProjectID, &update.Title, &update.Content,
			&update.CreatedAt, &update.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Load media for this update
		media, err := r.FindMediaByUpdateID(ctx, update.ID)
		if err == nil {
			update.Media = media
		}

		updates = append(updates, update)
	}

	return updates, nil
}

func (r *ProjectRepository) DeleteUpdate(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM project_updates WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// Project Update Media

func (r *ProjectRepository) CreateUpdateMedia(ctx context.Context, media *domain.ProjectUpdateMedia) error {
	query := `
		INSERT INTO project_update_media (id, project_update_id, media_url, media_type, caption, display_order)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at
	`

	return r.db.QueryRow(
		ctx, query,
		media.ID, media.ProjectUpdateID, media.MediaURL, media.MediaType, media.Caption, media.DisplayOrder,
	).Scan(&media.CreatedAt)
}

func (r *ProjectRepository) FindMediaByUpdateID(ctx context.Context, updateID uuid.UUID) ([]domain.ProjectUpdateMedia, error) {
	query := `
		SELECT id, project_update_id, media_url, media_type, caption, display_order, created_at
		FROM project_update_media
		WHERE project_update_id = $1
		ORDER BY display_order ASC, created_at ASC
	`

	rows, err := r.db.Query(ctx, query, updateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	mediaList := []domain.ProjectUpdateMedia{}
	for rows.Next() {
		media := domain.ProjectUpdateMedia{}
		err := rows.Scan(
			&media.ID, &media.ProjectUpdateID, &media.MediaURL, &media.MediaType,
			&media.Caption, &media.DisplayOrder, &media.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		mediaList = append(mediaList, media)
	}

	return mediaList, nil
}

func (r *ProjectRepository) DeleteUpdateMedia(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM project_update_media WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
