package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"aquabook/internal/domain"
)

type CommentRepository struct {
	db *pgxpool.Pool
}

func NewCommentRepository(db *pgxpool.Pool) *CommentRepository {
	return &CommentRepository{db: db}
}

// Create creates a new comment with optional image URLs
func (r *CommentRepository) Create(ctx context.Context, userID, commentableType, commentableID, content string, imageURLs []string) (*domain.Comment, error) {
	comment := &domain.Comment{}

	query := `
		INSERT INTO comments (user_id, commentable_type, commentable_id, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, commentable_type, commentable_id, content, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query, userID, commentableType, commentableID, content).Scan(
		&comment.ID,
		&comment.UserID,
		&comment.CommentableType,
		&comment.CommentableID,
		&comment.Content,
		&comment.CreatedAt,
		&comment.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}

	// Insert images if provided
	for i, url := range imageURLs {
		imgQuery := `INSERT INTO comment_images (comment_id, image_url, display_order) VALUES ($1, $2, $3) RETURNING id, comment_id, image_url, display_order, created_at`
		img := domain.CommentImage{}
		err := r.db.QueryRow(ctx, imgQuery, comment.ID, url, i).Scan(&img.ID, &img.CommentID, &img.ImageURL, &img.DisplayOrder, &img.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to insert comment image: %w", err)
		}
		comment.Images = append(comment.Images, img)
	}

	return comment, nil
}

// GetByCommentable retrieves all comments for a commentable entity
func (r *CommentRepository) GetByCommentable(ctx context.Context, commentableType, commentableID string) ([]domain.Comment, error) {
	query := `
		SELECT c.id, c.user_id, c.commentable_type, c.commentable_id, c.content, c.created_at, c.updated_at,
		       u.id, u.username, u.display_name, u.avatar_url
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.commentable_type = $1 AND c.commentable_id = $2 AND c.deleted_at IS NULL
		ORDER BY c.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, commentableType, commentableID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}
	defer rows.Close()

	comments := make([]domain.Comment, 0)
	for rows.Next() {
		var comment domain.Comment
		var user domain.User

		err := rows.Scan(
			&comment.ID,
			&comment.UserID,
			&comment.CommentableType,
			&comment.CommentableID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.UpdatedAt,
			&user.ID,
			&user.Username,
			&user.DisplayName,
			&user.AvatarURL,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}

		comment.User = &user
		comment.Images = make([]domain.CommentImage, 0)
		comments = append(comments, comment)
	}
	rows.Close()

	// Fetch images for all comments
	if len(comments) > 0 {
		// Build list of comment IDs
		commentIDs := make([]string, len(comments))
		commentIndex := make(map[string]int, len(comments))
		for i, c := range comments {
			commentIDs[i] = c.ID
			commentIndex[c.ID] = i
		}

		imgQuery := `
			SELECT id, comment_id, image_url, display_order, created_at
			FROM comment_images
			WHERE comment_id = ANY($1::uuid[])
			ORDER BY comment_id, display_order
		`
		imgRows, err := r.db.Query(ctx, imgQuery, commentIDs)
		if err == nil {
			defer imgRows.Close()
			for imgRows.Next() {
				var img domain.CommentImage
				if err := imgRows.Scan(&img.ID, &img.CommentID, &img.ImageURL, &img.DisplayOrder, &img.CreatedAt); err == nil {
					if idx, ok := commentIndex[img.CommentID]; ok {
						comments[idx].Images = append(comments[idx].Images, img)
					}
				}
			}
		}
	}

	return comments, nil
}

// GetByID retrieves a single comment
func (r *CommentRepository) GetByID(ctx context.Context, commentID string) (*domain.Comment, error) {
	comment := &domain.Comment{}

	query := `
		SELECT id, user_id, commentable_type, commentable_id, content, created_at, updated_at
		FROM comments
		WHERE id = $1 AND deleted_at IS NULL
	`

	err := r.db.QueryRow(ctx, query, commentID).Scan(
		&comment.ID,
		&comment.UserID,
		&comment.CommentableType,
		&comment.CommentableID,
		&comment.Content,
		&comment.CreatedAt,
		&comment.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get comment: %w", err)
	}

	return comment, nil
}

// Update updates a comment's content
func (r *CommentRepository) Update(ctx context.Context, commentID, content string) error {
	query := `
		UPDATE comments
		SET content = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, content, commentID)
	if err != nil {
		return fmt.Errorf("failed to update comment: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("comment not found")
	}

	return nil
}

// Delete soft deletes a comment
func (r *CommentRepository) Delete(ctx context.Context, commentID string) error {
	query := `
		UPDATE comments
		SET deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, commentID)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("comment not found")
	}

	return nil
}

// GetCountByCommentable returns the count of comments for a commentable entity
func (r *CommentRepository) GetCountByCommentable(ctx context.Context, commentableType, commentableID string) (int, error) {
	var count int

	query := `
		SELECT COUNT(*)
		FROM comments
		WHERE commentable_type = $1 AND commentable_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRow(ctx, query, commentableType, commentableID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get comment count: %w", err)
	}

	return count, nil
}
