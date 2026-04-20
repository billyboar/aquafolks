package service

import (
	"aquabook/internal/domain"
	"context"
	"fmt"
)

type TankRepository interface {
	Create(ctx context.Context, tank *domain.Tank) error
	GetByID(ctx context.Context, id string) (*domain.Tank, error)
	GetByUserID(ctx context.Context, userID string) ([]*domain.Tank, error)
	Update(ctx context.Context, id string, input *domain.UpdateTankInput) (*domain.Tank, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, limit, offset int) ([]*domain.Tank, error)
}

type TankService struct {
	tankRepo TankRepository
}

func NewTankService(tankRepo TankRepository) *TankService {
	return &TankService{tankRepo: tankRepo}
}

func (s *TankService) CreateTank(ctx context.Context, userID string, input *domain.CreateTankInput) (*domain.Tank, error) {
	// Validate input
	if input.Name == "" {
		return nil, fmt.Errorf("tank name is required")
	}
	if input.VolumeLiters <= 0 {
		return nil, fmt.Errorf("volume must be greater than 0")
	}

	tank := &domain.Tank{
		UserID:           userID,
		Name:             input.Name,
		Description:      input.Description,
		VolumeLiters:     input.VolumeLiters,
		DimensionsLength: input.DimensionsLength,
		DimensionsWidth:  input.DimensionsWidth,
		DimensionsHeight: input.DimensionsHeight,
		TankType:         input.TankType,
	}

	if err := s.tankRepo.Create(ctx, tank); err != nil {
		return nil, err
	}

	return tank, nil
}

func (s *TankService) GetTank(ctx context.Context, id string) (*domain.Tank, error) {
	return s.tankRepo.GetByID(ctx, id)
}

func (s *TankService) GetUserTanks(ctx context.Context, userID string) ([]*domain.Tank, error) {
	return s.tankRepo.GetByUserID(ctx, userID)
}

func (s *TankService) UpdateTank(ctx context.Context, id string, userID string, input *domain.UpdateTankInput) (*domain.Tank, error) {
	// Verify ownership
	tank, err := s.tankRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if tank.UserID != userID {
		return nil, fmt.Errorf("unauthorized: you don't own this tank")
	}

	return s.tankRepo.Update(ctx, id, input)
}

func (s *TankService) DeleteTank(ctx context.Context, id string, userID string) error {
	// Verify ownership
	tank, err := s.tankRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if tank.UserID != userID {
		return fmt.Errorf("unauthorized: you don't own this tank")
	}

	return s.tankRepo.Delete(ctx, id)
}

func (s *TankService) ListTanks(ctx context.Context, limit, offset int) ([]*domain.Tank, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return s.tankRepo.List(ctx, limit, offset)
}
