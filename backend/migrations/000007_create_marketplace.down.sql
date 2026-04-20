-- Drop triggers
DROP TRIGGER IF EXISTS marketplace_listing_updated_at_trigger ON marketplace_listings;
DROP TRIGGER IF EXISTS marketplace_listing_location_point_trigger ON marketplace_listings;

-- Drop functions
DROP FUNCTION IF EXISTS update_marketplace_listing_updated_at();
DROP FUNCTION IF EXISTS update_listing_location_point();

-- Drop indexes (CASCADE will handle this, but explicit for clarity)
DROP INDEX IF EXISTS idx_marketplace_reviews_seller_id;
DROP INDEX IF EXISTS idx_marketplace_reviews_listing_id;
DROP INDEX IF EXISTS idx_marketplace_favorites_listing_id;
DROP INDEX IF EXISTS idx_marketplace_favorites_user_id;
DROP INDEX IF EXISTS idx_marketplace_listing_photos_listing_id;
DROP INDEX IF EXISTS idx_marketplace_listings_location_point;
DROP INDEX IF EXISTS idx_marketplace_listings_price;
DROP INDEX IF EXISTS idx_marketplace_listings_bumped_at;
DROP INDEX IF EXISTS idx_marketplace_listings_created_at;
DROP INDEX IF EXISTS idx_marketplace_listings_status;
DROP INDEX IF EXISTS idx_marketplace_listings_category;
DROP INDEX IF EXISTS idx_marketplace_listings_user_id;

-- Drop tables
DROP TABLE IF EXISTS marketplace_reviews;
DROP TABLE IF EXISTS marketplace_favorites;
DROP TABLE IF EXISTS marketplace_listing_photos;
DROP TABLE IF EXISTS marketplace_listings;
