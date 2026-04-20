package domain

import (
	"time"

	"github.com/google/uuid"
)

type ListingCategory string
type ListingCondition string
type ListingPriceType string
type ListingStatus string

const (
	CategoryFish       ListingCategory = "fish"
	CategoryPlants     ListingCategory = "plants"
	CategoryEquipment  ListingCategory = "equipment"
	CategoryFullSetups ListingCategory = "full_setup"
	CategoryOther      ListingCategory = "other"

	ConditionNew  ListingCondition = "new"
	ConditionUsed ListingCondition = "used"
	ConditionNA   ListingCondition = "n/a"

	PriceTypeFixed      ListingPriceType = "fixed"
	PriceTypeFree       ListingPriceType = "free"
	PriceTypeNegotiable ListingPriceType = "negotiable"

	StatusAvailable ListingStatus = "available"
	StatusSold      ListingStatus = "sold"
	StatusReserved  ListingStatus = "reserved"
	StatusDeleted   ListingStatus = "deleted"
)

type Listing struct {
	ID              uuid.UUID        `json:"id"`
	UserID          uuid.UUID        `json:"user_id"`
	Title           string           `json:"title"`
	Description     string           `json:"description"`
	Category        ListingCategory  `json:"category"`
	Condition       *string          `json:"condition"`
	Price           *float64         `json:"price"`
	PriceType       ListingPriceType `json:"price_type"`
	Currency        string           `json:"currency"`
	LocationCity    string           `json:"location_city"`
	LocationState   string           `json:"location_state"`
	LocationCountry string           `json:"location_country"`
	LocationLat     *float64         `json:"location_lat"`
	LocationLng     *float64         `json:"location_lng"`
	Status          ListingStatus    `json:"status"`
	ViewCount       int              `json:"view_count"`
	FavoriteCount   int              `json:"favorite_count"`
	IsFeatured      bool             `json:"is_featured"`
	FeaturedUntil   *time.Time       `json:"featured_until"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	BumpedAt        time.Time        `json:"bumped_at"`

	// Relations
	Photos      []ListingPhoto  `json:"photos,omitempty"`
	User        *User           `json:"user,omitempty"`
	Reviews     []ListingReview `json:"reviews,omitempty"`
	IsFavorited bool            `json:"is_favorited,omitempty"`
	Distance    *float64        `json:"distance,omitempty"` // Distance in km from search location
}

type ListingPhoto struct {
	ID           uuid.UUID `json:"id"`
	ListingID    uuid.UUID `json:"listing_id"`
	PhotoURL     string    `json:"photo_url"`
	DisplayOrder int       `json:"display_order"`
	IsPrimary    bool      `json:"is_primary"`
	CreatedAt    time.Time `json:"created_at"`
}

type ListingFavorite struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	ListingID uuid.UUID `json:"listing_id"`
	CreatedAt time.Time `json:"created_at"`
}

type ListingReview struct {
	ID         uuid.UUID `json:"id"`
	ListingID  uuid.UUID `json:"listing_id"`
	ReviewerID uuid.UUID `json:"reviewer_id"`
	SellerID   uuid.UUID `json:"seller_id"`
	Rating     int       `json:"rating"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relations
	Reviewer *User `json:"reviewer,omitempty"`
}

type CreateListingInput struct {
	Title           string           `json:"title" validate:"required,min=3,max=255"`
	Description     string           `json:"description" validate:"required,min=10"`
	Category        ListingCategory  `json:"category" validate:"required"`
	Condition       *string          `json:"condition"`
	Price           *float64         `json:"price" validate:"omitempty,gte=0"`
	PriceType       ListingPriceType `json:"price_type" validate:"required"`
	LocationCity    string           `json:"location_city"`
	LocationState   string           `json:"location_state"`
	LocationCountry string           `json:"location_country"`
	LocationLat     *float64         `json:"location_lat"`
	LocationLng     *float64         `json:"location_lng"`
	Photos          []string         `json:"photos"` // Photo URLs
}

type UpdateListingInput struct {
	Title       *string           `json:"title"`
	Description *string           `json:"description"`
	Category    *ListingCategory  `json:"category"`
	Condition   *string           `json:"condition"`
	Price       *float64          `json:"price"`
	PriceType   *ListingPriceType `json:"price_type"`
	Status      *ListingStatus    `json:"status"`
}

type SearchListingsFilter struct {
	Category  *ListingCategory  `json:"category"`
	PriceMin  *float64          `json:"price_min"`
	PriceMax  *float64          `json:"price_max"`
	PriceType *ListingPriceType `json:"price_type"`
	Status    *ListingStatus    `json:"status"`
	UserID    *uuid.UUID        `json:"user_id"`
	Lat       *float64          `json:"lat"`
	Lng       *float64          `json:"lng"`
	RadiusKM  *float64          `json:"radius_km"`
	Keyword   *string           `json:"keyword"`
	Limit     int               `json:"limit"`
	Offset    int               `json:"offset"`
}

type CreateReviewInput struct {
	ListingID uuid.UUID `json:"listing_id" validate:"required"`
	Rating    int       `json:"rating" validate:"required,min=1,max=5"`
	Comment   string    `json:"comment"`
}
