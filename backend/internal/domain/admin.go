package domain

import (
	"time"

	"github.com/google/uuid"
)

// UserRole represents user permission levels
type UserRole string

const (
	RoleUser      UserRole = "user"
	RoleModerator UserRole = "moderator"
	RoleAdmin     UserRole = "admin"
)

// ReportableType represents types of content that can be reported
type ReportableType string

const (
	ReportableUser          ReportableType = "user"
	ReportableTank          ReportableType = "tank"
	ReportablePost          ReportableType = "post"
	ReportableComment       ReportableType = "comment"
	ReportableListing       ReportableType = "listing"
	ReportableProject       ReportableType = "project"
	ReportableProjectUpdate ReportableType = "project_update"
	ReportableMessage       ReportableType = "message"
)

// ReportReason represents reasons for reporting content
type ReportReason string

const (
	ReasonSpam                 ReportReason = "spam"
	ReasonHarassment           ReportReason = "harassment"
	ReasonInappropriateContent ReportReason = "inappropriate_content"
	ReasonScam                 ReportReason = "scam"
	ReasonFakeListing          ReportReason = "fake_listing"
	ReasonMisinformation       ReportReason = "misinformation"
	ReasonCopyright            ReportReason = "copyright"
	ReasonAnimalAbuse          ReportReason = "animal_abuse"
	ReasonOther                ReportReason = "other"
)

// ReportStatus represents the status of a report
type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "pending"
	ReportStatusReviewing ReportStatus = "reviewing"
	ReportStatusResolved  ReportStatus = "resolved"
	ReportStatusDismissed ReportStatus = "dismissed"
)

// ModerationAction represents actions taken by moderators
type ModerationAction string

const (
	ActionNone           ModerationAction = "none"
	ActionWarningSent    ModerationAction = "warning_sent"
	ActionContentRemoved ModerationAction = "content_removed"
	ActionUserBanned     ModerationAction = "user_banned"
	ActionUserSuspended  ModerationAction = "user_suspended"
)

// Report represents a user report
type Report struct {
	ID             uuid.UUID         `json:"id"`
	ReporterID     uuid.UUID         `json:"reporter_id"`
	ReportedUserID *uuid.UUID        `json:"reported_user_id,omitempty"`
	ReportableType ReportableType    `json:"reportable_type"`
	ReportableID   uuid.UUID         `json:"reportable_id"`
	Reason         ReportReason      `json:"reason"`
	Description    string            `json:"description"`
	Status         ReportStatus      `json:"status"`
	ModeratorID    *uuid.UUID        `json:"moderator_id,omitempty"`
	ModeratorNote  *string           `json:"moderator_note,omitempty"`
	ActionTaken    *ModerationAction `json:"action_taken,omitempty"`
	ResolvedAt     *time.Time        `json:"resolved_at,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`

	// Joined fields
	Reporter     *User `json:"reporter,omitempty"`
	ReportedUser *User `json:"reported_user,omitempty"`
	Moderator    *User `json:"moderator,omitempty"`
}

// CreateReportInput represents input for creating a report
type CreateReportInput struct {
	ReportedUserID *uuid.UUID     `json:"reported_user_id"`
	ReportableType ReportableType `json:"reportable_type" validate:"required"`
	ReportableID   uuid.UUID      `json:"reportable_id" validate:"required"`
	Reason         ReportReason   `json:"reason" validate:"required"`
	Description    string         `json:"description"`
}

// UpdateReportInput represents input for updating a report (moderator action)
type UpdateReportInput struct {
	Status        ReportStatus      `json:"status"`
	ModeratorNote string            `json:"moderator_note"`
	ActionTaken   *ModerationAction `json:"action_taken"`
}

// ModerationLog represents an audit log entry
type ModerationLog struct {
	ID          uuid.UUID              `json:"id"`
	ModeratorID uuid.UUID              `json:"moderator_id"`
	Action      string                 `json:"action"`
	TargetType  string                 `json:"target_type"`
	TargetID    uuid.UUID              `json:"target_id"`
	Details     map[string]interface{} `json:"details,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`

	// Joined fields
	Moderator *User `json:"moderator,omitempty"`
}

// UserSuspension represents a temporary user suspension
type UserSuspension struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	SuspendedBy uuid.UUID `json:"suspended_by"`
	Reason      string    `json:"reason"`
	SuspendedAt time.Time `json:"suspended_at"`
	ExpiresAt   time.Time `json:"expires_at"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`

	// Joined fields
	User      *User `json:"user,omitempty"`
	Moderator *User `json:"moderator,omitempty"`
}

// CreateSuspensionInput represents input for suspending a user
type CreateSuspensionInput struct {
	UserID    uuid.UUID `json:"user_id" validate:"required"`
	Reason    string    `json:"reason" validate:"required"`
	ExpiresAt time.Time `json:"expires_at" validate:"required"`
}

// BanUserInput represents input for banning a user
type BanUserInput struct {
	UserID uuid.UUID `json:"user_id" validate:"required"`
	Reason string    `json:"reason" validate:"required"`
}

// AdminStats represents admin dashboard statistics
type AdminStats struct {
	TotalUsers           int64 `json:"total_users"`
	ActiveUsers          int64 `json:"active_users"`
	BannedUsers          int64 `json:"banned_users"`
	SuspendedUsers       int64 `json:"suspended_users"`
	TotalTanks           int64 `json:"total_tanks"`
	TotalListings        int64 `json:"total_listings"`
	TotalProjects        int64 `json:"total_projects"`
	PendingReports       int64 `json:"pending_reports"`
	ResolvedReportsToday int64 `json:"resolved_reports_today"`
	NewUsersToday        int64 `json:"new_users_today"`
	NewUsersThisWeek     int64 `json:"new_users_this_week"`
	NewUsersThisMonth    int64 `json:"new_users_this_month"`
}
