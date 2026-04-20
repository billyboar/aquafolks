-- Enable PostGIS extension for location-based features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    location_coords GEOGRAPHY(POINT, 4326), -- PostGIS geography type for lat/lng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create spatial index for location-based queries
CREATE INDEX idx_users_location ON users USING GIST(location_coords);

-- Create regular indexes
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Tanks table
CREATE TABLE tanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    volume_liters DECIMAL(10, 2),
    tank_type VARCHAR(50), -- freshwater, saltwater, reef, planted, etc.
    setup_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tanks_user_id ON tanks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tanks_tank_type ON tanks(tank_type) WHERE deleted_at IS NULL;

-- Tank photos table
CREATE TABLE tank_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tank_photos_tank_id ON tank_photos(tank_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tank_photos_primary ON tank_photos(tank_id, is_primary) WHERE deleted_at IS NULL AND is_primary = TRUE;

-- Livestock table (fish, corals, inverts, plants)
CREATE TABLE livestock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    scientific_name VARCHAR(200),
    category VARCHAR(50), -- fish, coral, invertebrate, plant
    quantity INT DEFAULT 1,
    added_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_livestock_tank_id ON livestock(tank_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_livestock_category ON livestock(category) WHERE deleted_at IS NULL;

-- Marketplace listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- equipment, livestock, other
    listing_type VARCHAR(20) NOT NULL, -- sell, trade, giveaway
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    location_coords GEOGRAPHY(POINT, 4326), -- PostGIS for location-based search
    status VARCHAR(20) DEFAULT 'active', -- active, sold, expired, deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Spatial index for location-based marketplace search
CREATE INDEX idx_listings_location ON listings USING GIST(location_coords);
CREATE INDEX idx_listings_user_id ON listings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_category ON listings(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_status ON listings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

-- Listing photos table
CREATE TABLE listing_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos(listing_id) WHERE deleted_at IS NULL;

-- Project logs table (for documenting tank builds/upgrades)
CREATE TABLE project_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tank_id UUID REFERENCES tanks(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'in_progress', -- planning, in_progress, completed, on_hold
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_project_logs_user_id ON project_logs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_logs_tank_id ON project_logs(tank_id) WHERE deleted_at IS NULL;

-- Project updates table (timeline entries for projects)
CREATE TABLE project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_log_id UUID NOT NULL REFERENCES project_logs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_project_updates_project_log_id ON project_updates(project_log_id) WHERE deleted_at IS NULL;

-- Comments table (for tanks, listings, projects)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commentable_type VARCHAR(50) NOT NULL, -- tank, listing, project
    commentable_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_comments_commentable ON comments(commentable_type, commentable_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user_id ON comments(user_id) WHERE deleted_at IS NULL;

-- Likes table (for tanks, listings, projects)
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    likeable_type VARCHAR(50) NOT NULL, -- tank, listing, project
    likeable_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, likeable_type, likeable_id)
);

CREATE INDEX idx_likes_likeable ON likes(likeable_type, likeable_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- Messages table (for user-to-user messaging)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at) WHERE deleted_at IS NULL;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tanks_updated_at BEFORE UPDATE ON tanks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tank_photos_updated_at BEFORE UPDATE ON tank_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON livestock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_photos_updated_at BEFORE UPDATE ON listing_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_logs_updated_at BEFORE UPDATE ON project_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updates_updated_at BEFORE UPDATE ON project_updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
