package postgres

import (
	"aquabook/internal/domain"
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ListingRepository struct {
	db *pgxpool.Pool
}

func NewListingRepository(db *pgxpool.Pool) *ListingRepository {
	return &ListingRepository{db: db}
}

func (r *ListingRepository) Create(ctx context.Context, input *domain.CreateListingInput, userID uuid.UUID) (*domain.Listing, error) {
	listing := &domain.Listing{}

	query := `
		INSERT INTO marketplace_listings (
			user_id, title, description, category, condition, price, price_type, currency,
			location_city, location_state, location_country, location_lat, location_lng, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, user_id, title, description, category, condition, price, price_type, currency,
			location_city, location_state, location_country, location_lat, location_lng, status,
			view_count, favorite_count, is_featured, featured_until, created_at, updated_at, bumped_at
	`

	err := r.db.QueryRow(ctx, query,
		userID, input.Title, input.Description, input.Category, input.Condition, input.Price, input.PriceType, "USD",
		input.LocationCity, input.LocationState, input.LocationCountry, input.LocationLat, input.LocationLng, domain.StatusAvailable,
	).Scan(
		&listing.ID, &listing.UserID, &listing.Title, &listing.Description, &listing.Category, &listing.Condition,
		&listing.Price, &listing.PriceType, &listing.Currency, &listing.LocationCity, &listing.LocationState,
		&listing.LocationCountry, &listing.LocationLat, &listing.LocationLng, &listing.Status, &listing.ViewCount,
		&listing.FavoriteCount, &listing.IsFeatured, &listing.FeaturedUntil, &listing.CreatedAt, &listing.UpdatedAt, &listing.BumpedAt,
	)
	if err != nil {
		return nil, err
	}

	// Insert photos
	if len(input.Photos) > 0 {
		for i, photoURL := range input.Photos {
			isPrimary := i == 0
			_, err := r.db.Exec(ctx, `
				INSERT INTO marketplace_listing_photos (listing_id, photo_url, display_order, is_primary)
				VALUES ($1, $2, $3, $4)
			`, listing.ID, photoURL, i, isPrimary)
			if err != nil {
				return nil, err
			}
		}
	}

	return listing, nil
}

func (r *ListingRepository) GetByID(ctx context.Context, id uuid.UUID, currentUserID *uuid.UUID) (*domain.Listing, error) {
	listing := &domain.Listing{}

	query := `
		SELECT id, user_id, title, description, category, condition, price, price_type, currency,
			location_city, location_state, location_country, location_lat, location_lng, status,
			view_count, favorite_count, is_featured, featured_until, created_at, updated_at, bumped_at
		FROM marketplace_listings
		WHERE id = $1 AND status != $2
	`

	err := r.db.QueryRow(ctx, query, id, domain.StatusDeleted).Scan(
		&listing.ID, &listing.UserID, &listing.Title, &listing.Description, &listing.Category, &listing.Condition,
		&listing.Price, &listing.PriceType, &listing.Currency, &listing.LocationCity, &listing.LocationState,
		&listing.LocationCountry, &listing.LocationLat, &listing.LocationLng, &listing.Status, &listing.ViewCount,
		&listing.FavoriteCount, &listing.IsFeatured, &listing.FeaturedUntil, &listing.CreatedAt, &listing.UpdatedAt, &listing.BumpedAt,
	)
	if err != nil {
		return nil, err
	}

	// Increment view count
	_, _ = r.db.Exec(ctx, `UPDATE marketplace_listings SET view_count = view_count + 1 WHERE id = $1`, id)

	// Load photos
	photosQuery := `
		SELECT id, listing_id, photo_url, display_order, is_primary, created_at
		FROM marketplace_listing_photos
		WHERE listing_id = $1
		ORDER BY display_order ASC
	`
	rows, err := r.db.Query(ctx, photosQuery, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var photo domain.ListingPhoto
			if err := rows.Scan(&photo.ID, &photo.ListingID, &photo.PhotoURL, &photo.DisplayOrder, &photo.IsPrimary, &photo.CreatedAt); err == nil {
				listing.Photos = append(listing.Photos, photo)
			}
		}
	}

	// Check if current user favorited this listing
	if currentUserID != nil {
		var exists bool
		_ = r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM marketplace_favorites WHERE user_id = $1 AND listing_id = $2)`, currentUserID, id).Scan(&exists)
		listing.IsFavorited = exists
	}

	return listing, nil
}

func (r *ListingRepository) Search(ctx context.Context, filters *domain.SearchListingsFilter, currentUserID *uuid.UUID) ([]domain.Listing, error) {
	var listings []domain.Listing
	var conditions []string
	var args []interface{}
	argIndex := 1

	// Base query
	baseQuery := `
		SELECT l.id, l.user_id, l.title, l.description, l.category, l.condition, l.price, l.price_type, l.currency,
			l.location_city, l.location_state, l.location_country, l.location_lat, l.location_lng, l.status,
			l.view_count, l.favorite_count, l.is_featured, l.featured_until, l.created_at, l.updated_at, l.bumped_at
	`

	// Add distance calculation if lat/lng provided
	if filters.Lat != nil && filters.Lng != nil {
		baseQuery += fmt.Sprintf(`, ST_Distance(l.location_point, ST_SetSRID(ST_MakePoint($%d, $%d), 4326)::geography) / 1000 as distance`, argIndex, argIndex+1)
		args = append(args, *filters.Lng, *filters.Lat)
		argIndex += 2
	}

	baseQuery += ` FROM marketplace_listings l WHERE l.status != $` + fmt.Sprintf("%d", argIndex)
	args = append(args, domain.StatusDeleted)
	argIndex++

	// Apply filters
	if filters.Category != nil {
		conditions = append(conditions, fmt.Sprintf("l.category = $%d", argIndex))
		args = append(args, *filters.Category)
		argIndex++
	}

	if filters.Status != nil {
		conditions = append(conditions, fmt.Sprintf("l.status = $%d", argIndex))
		args = append(args, *filters.Status)
		argIndex++
	} else {
		conditions = append(conditions, "l.status = 'available'")
	}

	if filters.PriceType != nil {
		conditions = append(conditions, fmt.Sprintf("l.price_type = $%d", argIndex))
		args = append(args, *filters.PriceType)
		argIndex++
	}

	if filters.PriceMin != nil {
		conditions = append(conditions, fmt.Sprintf("l.price >= $%d", argIndex))
		args = append(args, *filters.PriceMin)
		argIndex++
	}

	if filters.PriceMax != nil {
		conditions = append(conditions, fmt.Sprintf("l.price <= $%d", argIndex))
		args = append(args, *filters.PriceMax)
		argIndex++
	}

	if filters.UserID != nil {
		conditions = append(conditions, fmt.Sprintf("l.user_id = $%d", argIndex))
		args = append(args, *filters.UserID)
		argIndex++
	}

	if filters.Keyword != nil && *filters.Keyword != "" {
		conditions = append(conditions, fmt.Sprintf("(l.title ILIKE $%d OR l.description ILIKE $%d)", argIndex, argIndex))
		keyword := "%" + *filters.Keyword + "%"
		args = append(args, keyword)
		argIndex++
	}

	// Distance filter
	if filters.RadiusKM != nil && filters.Lat != nil && filters.Lng != nil {
		conditions = append(conditions, fmt.Sprintf("ST_DWithin(l.location_point, ST_SetSRID(ST_MakePoint($%d, $%d), 4326)::geography, $%d)", argIndex, argIndex+1, argIndex+2))
		args = append(args, *filters.Lng, *filters.Lat, *filters.RadiusKM*1000) // Convert km to meters
		argIndex += 3
	}

	// Combine conditions
	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	// Ordering
	if filters.Lat != nil && filters.Lng != nil {
		baseQuery += " ORDER BY distance ASC"
	} else {
		baseQuery += " ORDER BY l.bumped_at DESC, l.created_at DESC"
	}

	// Pagination
	limit := filters.Limit
	if limit == 0 {
		limit = 20
	}
	baseQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, filters.Offset)

	rows, err := r.db.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var listing domain.Listing
		var distance *float64

		scanArgs := []interface{}{
			&listing.ID, &listing.UserID, &listing.Title, &listing.Description, &listing.Category, &listing.Condition,
			&listing.Price, &listing.PriceType, &listing.Currency, &listing.LocationCity, &listing.LocationState,
			&listing.LocationCountry, &listing.LocationLat, &listing.LocationLng, &listing.Status, &listing.ViewCount,
			&listing.FavoriteCount, &listing.IsFeatured, &listing.FeaturedUntil, &listing.CreatedAt, &listing.UpdatedAt, &listing.BumpedAt,
		}

		if filters.Lat != nil && filters.Lng != nil {
			scanArgs = append(scanArgs, &distance)
		}

		if err := rows.Scan(scanArgs...); err != nil {
			continue
		}

		listing.Distance = distance
		listings = append(listings, listing)
	}

	return listings, nil
}

func (r *ListingRepository) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, input *domain.UpdateListingInput) (*domain.Listing, error) {
	var updates []string
	var args []interface{}
	argIndex := 1

	if input.Title != nil {
		updates = append(updates, fmt.Sprintf("title = $%d", argIndex))
		args = append(args, *input.Title)
		argIndex++
	}

	if input.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *input.Description)
		argIndex++
	}

	if input.Category != nil {
		updates = append(updates, fmt.Sprintf("category = $%d", argIndex))
		args = append(args, *input.Category)
		argIndex++
	}

	if input.Condition != nil {
		updates = append(updates, fmt.Sprintf("condition = $%d", argIndex))
		args = append(args, *input.Condition)
		argIndex++
	}

	if input.Price != nil {
		updates = append(updates, fmt.Sprintf("price = $%d", argIndex))
		args = append(args, *input.Price)
		argIndex++
	}

	if input.PriceType != nil {
		updates = append(updates, fmt.Sprintf("price_type = $%d", argIndex))
		args = append(args, *input.PriceType)
		argIndex++
	}

	if input.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *input.Status)
		argIndex++
	}

	if len(updates) == 0 {
		return r.GetByID(ctx, id, &userID)
	}

	query := fmt.Sprintf(`
		UPDATE marketplace_listings
		SET %s
		WHERE id = $%d AND user_id = $%d
	`, strings.Join(updates, ", "), argIndex, argIndex+1)
	args = append(args, id, userID)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id, &userID)
}

func (r *ListingRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `UPDATE marketplace_listings SET status = $1 WHERE id = $2 AND user_id = $3`, domain.StatusDeleted, id, userID)
	return err
}

func (r *ListingRepository) ToggleFavorite(ctx context.Context, listingID uuid.UUID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM marketplace_favorites WHERE user_id = $1 AND listing_id = $2)`, userID, listingID).Scan(&exists)
	if err != nil {
		return false, err
	}

	if exists {
		_, err = r.db.Exec(ctx, `DELETE FROM marketplace_favorites WHERE user_id = $1 AND listing_id = $2`, userID, listingID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE marketplace_listings SET favorite_count = favorite_count - 1 WHERE id = $1`, listingID)
		return false, nil
	} else {
		_, err = r.db.Exec(ctx, `INSERT INTO marketplace_favorites (user_id, listing_id) VALUES ($1, $2)`, userID, listingID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE marketplace_listings SET favorite_count = favorite_count + 1 WHERE id = $1`, listingID)
		return true, nil
	}
}
