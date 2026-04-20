-- Remove fish_species_id from livestock table
DROP INDEX IF EXISTS idx_livestock_fish_species_id;
ALTER TABLE livestock DROP COLUMN IF EXISTS fish_species_id;
