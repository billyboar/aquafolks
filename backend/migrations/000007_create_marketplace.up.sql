-- Enable PostGIS for location-based features (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fish', 'plants', 'equipment', 'full_setup', 'other')),
    condition VARCHAR(20) CHECK (condition IN ('new', 'used', 'n/a')),
    price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('fixed', 'free', 'negotiable')),
    price DECIMAL(10, 2), -- in USD, null for free/negotiable
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Location for proximity search
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_point GEOGRAPHY(POINT, 4326), -- PostGIS geography point for distance queries
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'deleted')),
    
    -- Metadata
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bumped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create listing photos table
CREATE TABLE IF NOT EXISTS marketplace_listing_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create listing favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, listing_id)
);

-- Create reviews/ratings table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(listing_id, reviewer_id)
);

-- Create indexes for performance
CREATE INDEX idx_marketplace_listings_user_id ON marketplace_listings(user_id);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_created_at ON marketplace_listings(created_at DESC);
CREATE INDEX idx_marketplace_listings_bumped_at ON marketplace_listings(bumped_at DESC);
CREATE INDEX idx_marketplace_listings_price ON marketplace_listings(price);
CREATE INDEX idx_marketplace_listings_location_point ON marketplace_listings USING GIST(location_point);
CREATE INDEX idx_marketplace_listing_photos_listing_id ON marketplace_listing_photos(listing_id, display_order);
CREATE INDEX idx_marketplace_favorites_user_id ON marketplace_favorites(user_id);
CREATE INDEX idx_marketplace_favorites_listing_id ON marketplace_favorites(listing_id);
CREATE INDEX idx_marketplace_reviews_listing_id ON marketplace_reviews(listing_id);
CREATE INDEX idx_marketplace_reviews_seller_id ON marketplace_reviews(seller_id);

-- Function to automatically update location_point when lat/lng changes
CREATE OR REPLACE FUNCTION update_listing_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_listing_location_point_trigger
BEFORE INSERT OR UPDATE ON marketplace_listings
FOR EACH ROW
EXECUTE FUNCTION update_listing_location_point();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_listing_updated_at_trigger
BEFORE UPDATE ON marketplace_listings
FOR EACH ROW
EXECUTE FUNCTION update_marketplace_listing_updated_at();
