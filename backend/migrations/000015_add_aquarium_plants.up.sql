-- Create aquarium_plants table
CREATE TABLE IF NOT EXISTS aquarium_plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    common_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255) NOT NULL,
    plant_type VARCHAR(100) NOT NULL,        -- 'stem', 'rosette', 'moss', 'fern', 'floating', 'bulb', 'rhizome'
    water_type VARCHAR(50) NOT NULL DEFAULT 'freshwater',  -- 'freshwater', 'brackish'
    care_level VARCHAR(50) NOT NULL,         -- 'easy', 'medium', 'hard'
    light_requirement VARCHAR(50) NOT NULL,  -- 'low', 'medium', 'high'
    co2_required BOOLEAN NOT NULL DEFAULT FALSE,
    min_temp_c NUMERIC(5,2),
    max_temp_c NUMERIC(5,2),
    min_ph NUMERIC(4,2),
    max_ph NUMERIC(4,2),
    max_height_cm NUMERIC(6,2),
    growth_rate VARCHAR(50),                 -- 'slow', 'medium', 'fast'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aquarium_plants_common_name ON aquarium_plants(common_name);
CREATE INDEX idx_aquarium_plants_type ON aquarium_plants(plant_type);
CREATE INDEX idx_aquarium_plants_care_level ON aquarium_plants(care_level);
