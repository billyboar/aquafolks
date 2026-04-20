package service

import (
	"context"
	"fmt"
	"mime/multipart"
	"strings"

	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"
	"aquabook/pkg/storage"
)

type TankPhotoService struct {
	photoRepo *postgres.TankPhotoRepository
	tankRepo  *postgres.TankRepository
	storage   *storage.S3Client
}

func NewTankPhotoService(photoRepo *postgres.TankPhotoRepository, tankRepo *postgres.TankRepository, storage *storage.S3Client) *TankPhotoService {
	return &TankPhotoService{
		photoRepo: photoRepo,
		tankRepo:  tankRepo,
		storage:   storage,
	}
}

// UploadPhoto uploads a photo for a tank
func (s *TankPhotoService) UploadPhoto(ctx context.Context, tankID, userID string, file multipart.File, fileHeader *multipart.FileHeader, caption string, isPrimary bool) (*domain.TankPhoto, error) {
	// Verify tank ownership
	tank, err := s.tankRepo.GetByID(ctx, tankID)
	if err != nil {
		return nil, fmt.Errorf("tank not found: %w", err)
	}

	if tank.UserID != userID {
		return nil, fmt.Errorf("unauthorized: not tank owner")
	}

	// Validate file type
	contentType := fileHeader.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return nil, fmt.Errorf("invalid file type: must be an image")
	}

	// Validate file size (max 10MB)
	if fileHeader.Size > 10*1024*1024 {
		return nil, fmt.Errorf("file too large: max 10MB")
	}

	// Upload to storage
	photoURL, err := s.storage.UploadFile(ctx, file, fileHeader, fmt.Sprintf("tanks/%s", tankID))
	if err != nil {
		return nil, fmt.Errorf("failed to upload photo: %w", err)
	}

	// Get current photo count for order
	existingPhotos, err := s.photoRepo.GetByTankID(ctx, tankID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing photos: %w", err)
	}

	order := len(existingPhotos)

	// If this is the first photo, make it primary
	if len(existingPhotos) == 0 {
		isPrimary = true
	}

	// Create photo record
	photo, err := s.photoRepo.Create(ctx, tankID, photoURL, caption, isPrimary, order)
	if err != nil {
		// Try to delete uploaded file if database insert fails
		_ = s.storage.DeleteFile(ctx, photoURL)
		return nil, fmt.Errorf("failed to create photo record: %w", err)
	}

	// If setting as primary, update the primary photo
	if isPrimary && len(existingPhotos) > 0 {
		err = s.photoRepo.SetPrimary(ctx, photo.ID, tankID)
		if err != nil {
			return nil, fmt.Errorf("failed to set primary photo: %w", err)
		}
	}

	return photo, nil
}

// GetTankPhotos retrieves all photos for a tank
func (s *TankPhotoService) GetTankPhotos(ctx context.Context, tankID string) ([]domain.TankPhoto, error) {
	return s.photoRepo.GetByTankID(ctx, tankID)
}

// DeletePhoto deletes a photo
func (s *TankPhotoService) DeletePhoto(ctx context.Context, photoID, userID string) error {
	// Get photo
	photo, err := s.photoRepo.GetByID(ctx, photoID)
	if err != nil {
		return fmt.Errorf("photo not found: %w", err)
	}

	// Verify tank ownership
	tank, err := s.tankRepo.GetByID(ctx, photo.TankID)
	if err != nil {
		return fmt.Errorf("tank not found: %w", err)
	}

	if tank.UserID != userID {
		return fmt.Errorf("unauthorized: not tank owner")
	}

	// Delete from storage
	err = s.storage.DeleteFile(ctx, photo.URL)
	if err != nil {
		// Log error but continue with database deletion
		fmt.Printf("failed to delete file from storage: %v\n", err)
	}

	// Delete from database
	err = s.photoRepo.Delete(ctx, photoID)
	if err != nil {
		return fmt.Errorf("failed to delete photo: %w", err)
	}

	// If this was the primary photo, set another photo as primary
	if photo.IsPrimary {
		photos, err := s.photoRepo.GetByTankID(ctx, photo.TankID)
		if err == nil && len(photos) > 0 {
			// Set the first remaining photo as primary
			_ = s.photoRepo.SetPrimary(ctx, photos[0].ID, photo.TankID)
		}
	}

	return nil
}

// SetPrimaryPhoto sets a photo as the primary photo for a tank
func (s *TankPhotoService) SetPrimaryPhoto(ctx context.Context, photoID, userID string) error {
	// Get photo
	photo, err := s.photoRepo.GetByID(ctx, photoID)
	if err != nil {
		return fmt.Errorf("photo not found: %w", err)
	}

	// Verify tank ownership
	tank, err := s.tankRepo.GetByID(ctx, photo.TankID)
	if err != nil {
		return fmt.Errorf("tank not found: %w", err)
	}

	if tank.UserID != userID {
		return fmt.Errorf("unauthorized: not tank owner")
	}

	// Set as primary
	return s.photoRepo.SetPrimary(ctx, photoID, photo.TankID)
}

// UpdateCaption updates the caption of a photo
func (s *TankPhotoService) UpdateCaption(ctx context.Context, photoID, userID, caption string) error {
	// Get photo
	photo, err := s.photoRepo.GetByID(ctx, photoID)
	if err != nil {
		return fmt.Errorf("photo not found: %w", err)
	}

	// Verify tank ownership
	tank, err := s.tankRepo.GetByID(ctx, photo.TankID)
	if err != nil {
		return fmt.Errorf("tank not found: %w", err)
	}

	if tank.UserID != userID {
		return fmt.Errorf("unauthorized: not tank owner")
	}

	// Update caption
	return s.photoRepo.UpdateCaption(ctx, photoID, caption)
}

// ReorderPhotos updates the display order of photos
func (s *TankPhotoService) ReorderPhotos(ctx context.Context, tankID, userID string, photoIDs []string) error {
	// Verify tank ownership
	tank, err := s.tankRepo.GetByID(ctx, tankID)
	if err != nil {
		return fmt.Errorf("tank not found: %w", err)
	}

	if tank.UserID != userID {
		return fmt.Errorf("unauthorized: not tank owner")
	}

	// Update order for each photo
	for i, photoID := range photoIDs {
		err := s.photoRepo.UpdateOrder(ctx, photoID, i)
		if err != nil {
			return fmt.Errorf("failed to update photo order: %w", err)
		}
	}

	return nil
}
