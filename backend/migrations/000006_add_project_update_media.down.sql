-- Reverse migration: restore photo_url column and drop media table
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Drop the media table
DROP INDEX IF EXISTS idx_project_update_media_update_id;
DROP TABLE IF EXISTS project_update_media;
