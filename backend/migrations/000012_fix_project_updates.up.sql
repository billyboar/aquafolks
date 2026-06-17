-- Fix project_updates table to reference projects directly instead of project_logs
-- Drop existing FK and column
ALTER TABLE project_updates DROP CONSTRAINT IF EXISTS project_updates_project_log_id_fkey;
ALTER TABLE project_updates DROP COLUMN IF EXISTS project_log_id;
ALTER TABLE project_updates DROP COLUMN IF EXISTS deleted_at;

-- Add correct project_id column and title
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '';

-- Recreate index
DROP INDEX IF EXISTS idx_project_updates_project_log_id;
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
