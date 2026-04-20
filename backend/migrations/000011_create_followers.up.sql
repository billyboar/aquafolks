-- Create followers table
CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate follows and self-follows
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
CREATE INDEX idx_followers_created_at ON followers(created_at DESC);

-- Add follower/following counts to users table for efficient display
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

CREATE INDEX idx_users_follower_count ON users(follower_count DESC);
CREATE INDEX idx_users_following_count ON users(following_count DESC);

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment following_count for follower
        UPDATE users SET following_count = following_count + 1
        WHERE id = NEW.follower_id;
        
        -- Increment follower_count for user being followed
        UPDATE users SET follower_count = follower_count + 1
        WHERE id = NEW.following_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement following_count for follower
        UPDATE users SET following_count = GREATEST(following_count - 1, 0)
        WHERE id = OLD.follower_id;
        
        -- Decrement follower_count for user being unfollowed
        UPDATE users SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.following_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update counts
CREATE TRIGGER followers_count_trigger
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();
