-- Drop triggers
DROP TRIGGER IF EXISTS reports_updated_at ON reports;
DROP FUNCTION IF EXISTS update_reports_updated_at();

-- Drop tables
DROP TABLE IF EXISTS user_suspensions;
DROP TABLE IF EXISTS moderation_logs;
DROP TABLE IF EXISTS reports;

-- Drop indexes (they'll be dropped with tables, but explicit for clarity)
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_banned;

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS banned_by;
ALTER TABLE users DROP COLUMN IF EXISTS banned_reason;
ALTER TABLE users DROP COLUMN IF EXISTS banned_at;
ALTER TABLE users DROP COLUMN IF EXISTS is_banned;
ALTER TABLE users DROP COLUMN IF EXISTS role;
