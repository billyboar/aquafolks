package service

import (
	"aquabook/internal/domain"
	"context"
)

type FishSpeciesRepository interface {
	Search(ctx context.Context, query string, limit int) ([]*domain.FishSpecies, error)
	GetByID(ctx context.Context, id string) (*domain.FishSpecies, error)
}

type FishSpeciesService struct {
	fishRepo FishSpeciesRepository
}

func NewFishSpeciesService(fishRepo FishSpeciesRepository) *FishSpeciesService {
	return &FishSpeciesService{fishRepo: fishRepo}
}

func (s *FishSpeciesService) Search(ctx context.Context, query string, limit int) ([]*domain.FishSpecies, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return s.fishRepo.Search(ctx, query, limit)
}

func (s *FishSpeciesService) GetByID(ctx context.Context, id string) (*domain.FishSpecies, error) {
	return s.fishRepo.GetByID(ctx, id)
}
