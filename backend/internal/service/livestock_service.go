package service

import (
	"aquabook/internal/domain"
	"context"
	"fmt"
)

type LivestockRepository interface {
	Create(ctx context.Context, livestock *domain.Livestock) error
	GetByTankID(ctx context.Context, tankID string) ([]*domain.Livestock, error)
	GetByID(ctx context.Context, id string) (*domain.Livestock, error)
	Delete(ctx context.Context, id string) error
}

type LivestockService struct {
	livestockRepo LivestockRepository
	tankRepo      TankRepository
}

func NewLivestockService(livestockRepo LivestockRepository, tankRepo TankRepository) *LivestockService {
	return &LivestockService{
		livestockRepo: livestockRepo,
		tankRepo:      tankRepo,
	}
}

func (s *LivestockService) AddLivestock(ctx context.Context, tankID string, userID string, input *domain.AddLivestockInput) (*domain.Livestock, error) {
	// Verify tank exists and user owns it
	tank, err := s.tankRepo.GetByID(ctx, tankID)
	if err != nil {
		return nil, err
	}

	if tank.UserID != userID {
		return nil, fmt.Errorf("unauthorized: you don't own this tank")
	}

	// Validate input
	if input.Quantity <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	livestock := &domain.Livestock{
		TankID:         tankID,
		FishSpeciesID:  input.FishSpeciesID,
		CommonName:     input.CommonName,
		ScientificName: input.ScientificName,
		Quantity:       input.Quantity,
		Type:           input.Type,
		Active:         true,
	}

	if err := s.livestockRepo.Create(ctx, livestock); err != nil {
		return nil, err
	}

	return livestock, nil
}

func (s *LivestockService) GetTankLivestock(ctx context.Context, tankID string) ([]*domain.Livestock, error) {
	return s.livestockRepo.GetByTankID(ctx, tankID)
}

func (s *LivestockService) DeleteLivestock(ctx context.Context, id string, userID string) error {
	// Get livestock to verify tank ownership
	livestock, err := s.livestockRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Verify tank ownership
	tank, err := s.tankRepo.GetByID(ctx, livestock.TankID)
	if err != nil {
		return err
	}

	if tank.UserID != userID {
		return fmt.Errorf("unauthorized: you don't own this tank")
	}

	return s.livestockRepo.Delete(ctx, id)
}
