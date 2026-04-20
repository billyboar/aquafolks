-- Create project_update_media table for images and videos in updates
CREATE TABLE IF NOT EXISTS project_update_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_update_id UUID NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL, -- 'image' or 'video'
    caption TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_project_update_media_update_id ON project_update_media(project_update_id, display_order);

-- Remove the old photo_url column from project_updates (it's now in project_update_media)
ALTER TABLE project_updates DROP COLUMN IF EXISTS photo_url;
