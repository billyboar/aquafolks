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

	"github.com/jackc/pgx/v5/pgxpool"
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

type AquariumPlant struct {
	CommonName       string   `json:"common_name"`
	ScientificName   string   `json:"scientific_name"`
	PlantType        string   `json:"plant_type"`
	WaterType        string   `json:"water_type"`
	CareLevel        string   `json:"care_level"`
	LightRequirement string   `json:"light_requirement"`
	Co2Required      bool     `json:"co2_required"`
	MinTempC         *float64 `json:"min_temp_c"`
	MaxTempC         *float64 `json:"max_temp_c"`
	MinPH            *float64 `json:"min_ph"`
	MaxPH            *float64 `json:"max_ph"`
	MaxHeightCm      *float64 `json:"max_height_cm"`
	GrowthRate       string   `json:"growth_rate"`
	Description      string   `json:"description"`
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

	seedFish(db)
	seedPlants(db)

	fmt.Println("Seeding complete!")
}

func seedFish(db *pgxpool.Pool) {
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

	query := `
		INSERT INTO fish_species (
			common_name, scientific_name, category, type,
			min_tank_size_liters, max_size_cm, temperament,
			care_level, diet
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT DO NOTHING
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
			log.Printf("Failed to insert fish %s: %v\n", sp.CommonName, err)
			continue
		}
		count++
	}

	log.Printf("✓ Successfully imported %d/%d fish species\n", count, len(species))
}

func seedPlants(db *pgxpool.Pool) {
	file, err := os.Open("data/aquarium_plants.json")
	if err != nil {
		log.Fatal("Failed to open aquarium plants file:", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		log.Fatal("Failed to read aquarium plants file:", err)
	}

	var plants []AquariumPlant
	if err := json.Unmarshal(data, &plants); err != nil {
		log.Fatal("Failed to parse plants JSON:", err)
	}

	log.Printf("Found %d aquarium plants to import\n", len(plants))

	query := `
		INSERT INTO aquarium_plants (
			common_name, scientific_name, plant_type, water_type,
			care_level, light_requirement, co2_required,
			min_temp_c, max_temp_c, min_ph, max_ph,
			max_height_cm, growth_rate, description
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT DO NOTHING
	`

	count := 0
	ctx := context.Background()
	for _, p := range plants {
		_, err := db.Exec(
			ctx,
			query,
			p.CommonName,
			p.ScientificName,
			p.PlantType,
			p.WaterType,
			p.CareLevel,
			p.LightRequirement,
			p.Co2Required,
			p.MinTempC,
			p.MaxTempC,
			p.MinPH,
			p.MaxPH,
			p.MaxHeightCm,
			p.GrowthRate,
			p.Description,
		)
		if err != nil {
			log.Printf("Failed to insert plant %s: %v\n", p.CommonName, err)
			continue
		}
		count++
	}

	log.Printf("✓ Successfully imported %d/%d aquarium plants\n", count, len(plants))
}
