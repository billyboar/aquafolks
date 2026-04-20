package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

	"aquabook/internal/config"
	"aquabook/pkg/database"

	"github.com/joho/godotenv"
)

type FishSpecies struct {
	CommonName        string  `json:"common_name"`
	ScientificName    string  `json:"scientific_name"`
	Category          string  `json:"category"`
	Type              string  `json:"type"`
	MinTankSizeLiters float64 `json:"min_tank_size_liters"`
	MaxSizeCm         float64 `json:"max_size_cm"`
	Temperament       string  `json:"temperament"`
	CareLevel         string  `json:"care_level"`
	Diet              string  `json:"diet"`
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.NewPostgresConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	log.Println("✓ Connected to database")

	// Read the JSON file
	file, err := os.Open("data/fish_species.json")
	if err != nil {
		log.Fatal("Failed to open fish species file:", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		log.Fatal("Failed to read fish species file:", err)
	}

	var species []FishSpecies
	if err := json.Unmarshal(data, &species); err != nil {
		log.Fatal("Failed to parse JSON:", err)
	}

	log.Printf("Found %d fish species to import\n", len(species))

	// Insert each species
	query := `
		INSERT INTO fish_species (
			common_name, scientific_name, category, type,
			min_tank_size_liters, max_size_cm, temperament,
			care_level, diet
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	count := 0
	ctx := context.Background()
	for _, sp := range species {
		_, err := db.Exec(
			ctx,
			query,
			sp.CommonName,
			sp.ScientificName,
			sp.Category,
			sp.Type,
			sp.MinTankSizeLiters,
			sp.MaxSizeCm,
			sp.Temperament,
			sp.CareLevel,
			sp.Diet,
		)
		if err != nil {
			log.Printf("Failed to insert %s: %v\n", sp.CommonName, err)
			continue
		}
		count++
	}

	log.Printf("✓ Successfully imported %d/%d fish species\n", count, len(species))
	fmt.Println("Seeding complete!")
}
