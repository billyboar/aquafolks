-- Drop triggers
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_project_updates_updated_at ON project_updates;
DROP TRIGGER IF EXISTS update_project_logs_updated_at ON project_logs;
DROP TRIGGER IF EXISTS update_listing_photos_updated_at ON listing_photos;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS update_livestock_updated_at ON livestock;
DROP TRIGGER IF EXISTS update_tank_photos_updated_at ON tank_photos;
DROP TRIGGER IF EXISTS update_tanks_updated_at ON tanks;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS project_updates;
DROP TABLE IF EXISTS project_logs;
DROP TABLE IF EXISTS listing_photos;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS livestock;
DROP TABLE IF EXISTS tank_photos;
DROP TABLE IF EXISTS tanks;
DROP TABLE IF EXISTS users;

-- Drop PostGIS extension
DROP EXTENSION IF EXISTS postgis;
