-- Remove dimension columns from tanks table
ALTER TABLE tanks DROP COLUMN dimensions_length;
ALTER TABLE tanks DROP COLUMN dimensions_width;
ALTER TABLE tanks DROP COLUMN dimensions_height;
ALTER TABLE tanks DROP COLUMN cover_photo_url;
