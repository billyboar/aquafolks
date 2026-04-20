-- Create fish species table
CREATE TABLE fish_species (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    common_name VARCHAR(200) NOT NULL,
    scientific_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- fish, invertebrate, coral, plant
    type VARCHAR(50) NOT NULL, -- freshwater, saltwater, brackish
    min_tank_size_liters DECIMAL(10, 2),
    max_size_cm DECIMAL(10, 2),
    temperament VARCHAR(50), -- peaceful, semi-aggressive, aggressive
    care_level VARCHAR(50), -- easy, moderate, difficult
    diet VARCHAR(50), -- herbivore, carnivore, omnivore
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for searching
CREATE INDEX idx_fish_species_common_name ON fish_species USING GIN (to_tsvector('english', common_name));
CREATE INDEX idx_fish_species_scientific_name ON fish_species USING GIN (to_tsvector('english', scientific_name));
CREATE INDEX idx_fish_species_type ON fish_species(type);
CREATE INDEX idx_fish_species_category ON fish_species(category);

-- Add trigger for updated_at
CREATE TRIGGER update_fish_species_updated_at BEFORE UPDATE ON fish_species
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
