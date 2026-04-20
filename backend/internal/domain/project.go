package domain

import (
	"time"

	"github.com/google/uuid"
)

type ProjectType string

const (
	ProjectTypeBreeding         ProjectType = "breeding"
	ProjectTypeAquascaping      ProjectType = "aquascaping"
	ProjectTypeDiseasetreatment ProjectType = "disease_treatment"
	ProjectTypeEquipmentDIY     ProjectType = "equipment_diy"
	ProjectTypeSpeciesCare      ProjectType = "species_care"
	ProjectTypeBiotope          ProjectType = "biotope"
)

type ProjectStatus string

const (
	ProjectStatusPlanning   ProjectStatus = "planning"
	ProjectStatusInProgress ProjectStatus = "in_progress"
	ProjectStatusCompleted  ProjectStatus = "completed"
	ProjectStatusOnHold     ProjectStatus = "on_hold"
	ProjectStatusAbandoned  ProjectStatus = "abandoned"
)

type Project struct {
	ID            uuid.UUID     `json:"id"`
	UserID        uuid.UUID     `json:"user_id"`
	TankID        *uuid.UUID    `json:"tank_id"`
	Title         string        `json:"title"`
	Description   string        `json:"description"`
	ProjectType   ProjectType   `json:"project_type"`
	Status        ProjectStatus `json:"status"`
	StartDate     *time.Time    `json:"start_date"`
	EndDate       *time.Time    `json:"end_date"`
	CoverPhotoURL string        `json:"cover_photo_url"`
	IsPublic      bool          `json:"is_public"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`

	// Relationships
	User    *User           `json:"user,omitempty"`
	Tank    *Tank           `json:"tank,omitempty"`
	Updates []ProjectUpdate `json:"updates,omitempty"`
}

type ProjectUpdate struct {
	ID        uuid.UUID            `json:"id"`
	ProjectID uuid.UUID            `json:"project_id"`
	Title     string               `json:"title"`
	Content   string               `json:"content"`
	CreatedAt time.Time            `json:"created_at"`
	UpdatedAt time.Time            `json:"updated_at"`
	Media     []ProjectUpdateMedia `json:"media,omitempty"`
}

type ProjectUpdateMedia struct {
	ID              uuid.UUID `json:"id"`
	ProjectUpdateID uuid.UUID `json:"project_update_id"`
	MediaURL        string    `json:"media_url"`
	MediaType       string    `json:"media_type"` // 'image' or 'video'
	Caption         string    `json:"caption"`
	DisplayOrder    int       `json:"display_order"`
	CreatedAt       time.Time `json:"created_at"`
}

type CreateProjectInput struct {
	TankID      *string       `json:"tank_id"`
	Title       string        `json:"title" validate:"required,min=3,max=255"`
	Description string        `json:"description"`
	ProjectType ProjectType   `json:"project_type" validate:"required"`
	Status      ProjectStatus `json:"status"`
	StartDate   *time.Time    `json:"start_date"`
	IsPublic    *bool         `json:"is_public"`
}

type UpdateProjectInput struct {
	Title         *string        `json:"title"`
	Description   *string        `json:"description"`
	ProjectType   *ProjectType   `json:"project_type"`
	Status        *ProjectStatus `json:"status"`
	StartDate     *time.Time     `json:"start_date"`
	EndDate       *time.Time     `json:"end_date"`
	CoverPhotoURL *string        `json:"cover_photo_url"`
	IsPublic      *bool          `json:"is_public"`
}

type CreateProjectUpdateInput struct {
	Title   string                          `json:"title" validate:"required,min=1,max=255"`
	Content string                          `json:"content" validate:"required,min=1"`
	Media   []CreateProjectUpdateMediaInput `json:"media"`
}

type CreateProjectUpdateMediaInput struct {
	MediaURL     string `json:"media_url" validate:"required"`
	MediaType    string `json:"media_type" validate:"required,oneof=image video"`
	Caption      string `json:"caption"`
	DisplayOrder int    `json:"display_order"`
}
