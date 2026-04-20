package service

import (
	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"
	"context"

	"github.com/google/uuid"
)

type ListingService struct {
	listingRepo *postgres.ListingRepository
	userRepo    *postgres.UserRepository
}

func NewListingService(listingRepo *postgres.ListingRepository, userRepo *postgres.UserRepository) *ListingService {
	return &ListingService{
		listingRepo: listingRepo,
		userRepo:    userRepo,
	}
}

func (s *ListingService) CreateListing(ctx context.Context, input *domain.CreateListingInput, userID uuid.UUID) (*domain.Listing, error) {
	return s.listingRepo.Create(ctx, input, userID)
}

func (s *ListingService) GetListing(ctx context.Context, id uuid.UUID, currentUserID *uuid.UUID) (*domain.Listing, error) {
	listing, err := s.listingRepo.GetByID(ctx, id, currentUserID)
	if err != nil {
		return nil, err
	}

	// Load user info
	user, err := s.userRepo.GetByID(ctx, listing.UserID)
	if err == nil {
		listing.User = user
	}

	return listing, nil
}

func (s *ListingService) SearchListings(ctx context.Context, filters *domain.SearchListingsFilter, currentUserID *uuid.UUID) ([]domain.Listing, error) {
	listings, err := s.listingRepo.Search(ctx, filters, currentUserID)
	if err != nil {
		return nil, err
	}

	// Load user info for each listing
	for i := range listings {
		user, err := s.userRepo.GetByID(ctx, listings[i].UserID)
		if err == nil {
			listings[i].User = user
		}
	}

	return listings, nil
}

func (s *ListingService) UpdateListing(ctx context.Context, id uuid.UUID, userID uuid.UUID, input *domain.UpdateListingInput) (*domain.Listing, error) {
	return s.listingRepo.Update(ctx, id, userID, input)
}

func (s *ListingService) DeleteListing(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.listingRepo.Delete(ctx, id, userID)
}

func (s *ListingService) ToggleFavorite(ctx context.Context, listingID uuid.UUID, userID uuid.UUID) (bool, error) {
	return s.listingRepo.ToggleFavorite(ctx, listingID, userID)
}
