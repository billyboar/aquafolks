-- Drop function
DROP FUNCTION IF EXISTS get_unread_notification_count(UUID);

-- Remove notification_preferences column
ALTER TABLE users DROP COLUMN IF EXISTS notification_preferences;

-- Drop tables
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS project_subscriptions;
DROP TABLE IF EXISTS notifications;
