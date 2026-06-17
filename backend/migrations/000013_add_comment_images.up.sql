CREATE TABLE IF NOT EXISTS comment_images (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id   UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    image_url    TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comment_images_comment_id ON comment_images(comment_id);
