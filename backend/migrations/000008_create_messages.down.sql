-- Drop trigger
DROP TRIGGER IF EXISTS messages_updated_at ON messages;
DROP FUNCTION IF EXISTS update_messages_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_messages_unread;
DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_receiver;
DROP INDEX IF EXISTS idx_messages_sender;

-- Drop view
DROP VIEW IF EXISTS conversations;

-- Drop table
DROP TABLE IF EXISTS messages;
