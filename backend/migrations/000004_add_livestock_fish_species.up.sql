-- Add fish_species_id to livestock table
ALTER TABLE livestock ADD COLUMN fish_species_id UUID REFERENCES fish_species(id) ON DELETE SET NULL;

-- Add index for fish species lookup
CREATE INDEX idx_livestock_fish_species_id ON livestock(fish_species_id);
