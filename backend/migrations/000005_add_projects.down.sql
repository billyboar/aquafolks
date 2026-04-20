-- Drop triggers
DROP TRIGGER IF EXISTS update_project_updates_updated_at ON project_updates;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

-- Drop indexes
DROP INDEX IF EXISTS idx_project_updates_created_at;
DROP INDEX IF EXISTS idx_project_updates_project_id;
DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_type;
DROP INDEX IF EXISTS idx_projects_tank_id;
DROP INDEX IF EXISTS idx_projects_user_id;

-- Drop tables
DROP TABLE IF EXISTS project_updates;
DROP TABLE IF EXISTS projects;
