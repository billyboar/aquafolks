-- Revert: restore project_log_id and remove project_id/title
ALTER TABLE project_updates DROP CONSTRAINT IF EXISTS project_updates_project_id_fkey;
ALTER TABLE project_updates DROP COLUMN IF EXISTS project_id;
ALTER TABLE project_updates DROP COLUMN IF EXISTS title;
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS project_log_id UUID NOT NULL REFERENCES project_logs(id) ON DELETE CASCADE;
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_project_updates_project_log_id ON project_updates(project_log_id) WHERE deleted_at IS NULL;
