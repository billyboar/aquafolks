-- Drop trigger and function
DROP TRIGGER IF EXISTS followers_count_trigger ON followers;
DROP FUNCTION IF EXISTS update_follower_counts();

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS follower_count;
ALTER TABLE users DROP COLUMN IF EXISTS following_count;

-- Drop followers table
DROP TABLE IF EXISTS followers;
