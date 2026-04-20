package domain

import "time"

type TankType string

const (
	TankTypeFreshwater TankType = "freshwater"
	TankTypeSaltwater  TankType = "saltwater"
	TankTypePlanted    TankType = "planted"
	TankTypeReef       TankType = "reef"
	TankTypeBrackish   TankType = "brackish"
)

type Tank struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	Name             string    `json:"name"`
	VolumeLiters     float64   `json:"volume_liters"`
	DimensionsLength float64   `json:"dimensions_length"`
	DimensionsWidth  float64   `json:"dimensions_width"`
	DimensionsHeight float64   `json:"dimensions_height"`
	TankType         TankType  `json:"tank_type"`
	CoverPhotoURL    string    `json:"cover_photo_url"`
	Description      string    `json:"description"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relations (populated when needed)
	Photos    []TankPhoto `json:"photos,omitempty"`
	Livestock []Livestock `json:"livestock,omitempty"`
	User      *User       `json:"user,omitempty"`
}

type TankPhoto struct {
	ID        string    `json:"id"`
	TankID    string    `json:"tank_id"`
	URL       string    `json:"url"`
	Caption   string    `json:"caption"`
	IsPrimary bool      `json:"is_primary"`
	Order     int       `json:"order"`
	CreatedAt time.Time `json:"created_at"`
}

type Livestock struct {
	ID             string       `json:"id"`
	TankID         string       `json:"tank_id"`
	FishSpeciesID  *string      `json:"fish_species_id"`
	CommonName     string       `json:"common_name"`
	ScientificName string       `json:"scientific_name"`
	Quantity       int          `json:"quantity"`
	Type           string       `json:"type"` // fish, plant, invertebrate
	Active         bool         `json:"active"`
	CreatedAt      time.Time    `json:"created_at"`
	FishSpecies    *FishSpecies `json:"fish_species,omitempty"`
}

type AddLivestockInput struct {
	FishSpeciesID  *string `json:"fish_species_id"`
	CommonName     string  `json:"common_name"`
	ScientificName string  `json:"scientific_name"`
	Quantity       int     `json:"quantity" validate:"gt=0"`
	Type           string  `json:"type"`
}

type CreateTankInput struct {
	Name             string   `json:"name" validate:"required,min=1,max=255"`
	VolumeLiters     float64  `json:"volume_liters" validate:"gt=0"`
	DimensionsLength float64  `json:"dimensions_length"`
	DimensionsWidth  float64  `json:"dimensions_width"`
	DimensionsHeight float64  `json:"dimensions_height"`
	TankType         TankType `json:"tank_type" validate:"required"`
	Description      string   `json:"description"`
}

type UpdateTankInput struct {
	Name             *string   `json:"name"`
	VolumeLiters     *float64  `json:"volume_liters"`
	DimensionsLength *float64  `json:"dimensions_length"`
	DimensionsWidth  *float64  `json:"dimensions_width"`
	DimensionsHeight *float64  `json:"dimensions_height"`
	TankType         *TankType `json:"tank_type"`
	CoverPhotoURL    *string   `json:"cover_photo_url"`
	Description      *string   `json:"description"`
}
