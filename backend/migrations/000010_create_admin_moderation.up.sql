-- Add admin role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role IN ('moderator', 'admin');
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(is_banned) WHERE is_banned = TRUE;

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Polymorphic relationship to reported content
    reportable_type VARCHAR(50) NOT NULL CHECK (reportable_type IN ('user', 'tank', 'post', 'comment', 'listing', 'project', 'project_update', 'message')),
    reportable_id UUID NOT NULL,
    
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'spam',
        'harassment',
        'inappropriate_content',
        'scam',
        'fake_listing',
        'misinformation',
        'copyright',
        'animal_abuse',
        'other'
    )),
    description TEXT,
    
    -- Report status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    
    -- Moderation action
    moderator_id UUID REFERENCES users(id),
    moderator_note TEXT,
    action_taken VARCHAR(50) CHECK (action_taken IN ('none', 'warning_sent', 'content_removed', 'user_banned', 'user_suspended')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate reports
    CONSTRAINT unique_report UNIQUE (reporter_id, reportable_type, reportable_id)
);

-- Indexes for reports
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_reports_reportable ON reports(reportable_type, reportable_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_moderator ON reports(moderator_id);

-- Create moderation_logs table for audit trail
CREATE TABLE moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_moderation_logs_moderator ON moderation_logs(moderator_id, created_at DESC);
CREATE INDEX idx_moderation_logs_target ON moderation_logs(target_type, target_id);

-- Create user_suspensions table
CREATE TABLE user_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suspended_by UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_suspension_period CHECK (expires_at > suspended_at)
);

CREATE INDEX idx_user_suspensions_user ON user_suspensions(user_id, is_active);
CREATE INDEX idx_user_suspensions_expires ON user_suspensions(expires_at) WHERE is_active = TRUE;

-- Trigger to update reports updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();
