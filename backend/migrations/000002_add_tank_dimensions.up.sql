-- Add dimension columns to tanks table
ALTER TABLE tanks ADD COLUMN dimensions_length DECIMAL(10, 2);
ALTER TABLE tanks ADD COLUMN dimensions_width DECIMAL(10, 2);
ALTER TABLE tanks ADD COLUMN dimensions_height DECIMAL(10, 2);

-- Add cover photo URL column
ALTER TABLE tanks ADD COLUMN cover_photo_url VARCHAR(500);
