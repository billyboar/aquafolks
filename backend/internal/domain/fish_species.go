package domain

import "time"

type FishSpecies struct {
	ID                string    `json:"id"`
	CommonName        string    `json:"common_name"`
	ScientificName    string    `json:"scientific_name"`
	Category          string    `json:"category"`
	Type              string    `json:"type"`
	MinTankSizeLiters float64   `json:"min_tank_size_liters"`
	MaxSizeCm         float64   `json:"max_size_cm"`
	Temperament       string    `json:"temperament"`
	CareLevel         string    `json:"care_level"`
	Diet              string    `json:"diet"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
