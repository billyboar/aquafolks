package service

import (
	"context"
	"fmt"

	"aquabook/internal/domain"
	"aquabook/internal/repository/postgres"
	"github.com/google/uuid"
)

type AdminService struct {
	adminRepo *postgres.AdminRepository
	userRepo  *postgres.UserRepository
}

func NewAdminService(adminRepo *postgres.AdminRepository, userRepo *postgres.UserRepository) *AdminService {
	return &AdminService{
		adminRepo: adminRepo,
		userRepo:  userRepo,
	}
}

// Reports

func (s *AdminService) CreateReport(ctx context.Context, reporterID uuid.UUID, input *domain.CreateReportInput) (*domain.Report, error) {
	report := &domain.Report{
		ReporterID:     reporterID,
		ReportedUserID: input.ReportedUserID,
		ReportableType: input.ReportableType,
		ReportableID:   input.ReportableID,
		Reason:         input.Reason,
		Description:    input.Description,
		Status:         domain.ReportStatusPending,
	}

	if err := s.adminRepo.CreateReport(ctx, report); err != nil {
		return nil, err
	}

	return report, nil
}

func (s *AdminService) GetReport(ctx context.Context, id uuid.UUID) (*domain.Report, error) {
	return s.adminRepo.GetReportByID(ctx, id)
}

func (s *AdminService) ListReports(ctx context.Context, status *domain.ReportStatus, page, limit int) ([]*domain.Report, int, error) {
	offset := (page - 1) * limit
	return s.adminRepo.ListReports(ctx, status, limit, offset)
}

func (s *AdminService) UpdateReport(ctx context.Context, reportID, moderatorID uuid.UUID, input *domain.UpdateReportInput) error {
	// Verify moderator has appropriate role
	moderator, err := s.userRepo.GetByID(ctx, moderatorID)
	if err != nil {
		return err
	}

	if moderator.Role == nil || (*moderator.Role != domain.RoleModerator && *moderator.Role != domain.RoleAdmin) {
		return fmt.Errorf("insufficient permissions")
	}

	// Update the report
	if err := s.adminRepo.UpdateReport(ctx, reportID, moderatorID, input); err != nil {
		return err
	}

	// Log the moderation action
	log := &domain.ModerationLog{
		ModeratorID: moderatorID,
		Action:      "updated_report",
		TargetType:  "report",
		TargetID:    reportID,
		Details: map[string]interface{}{
			"status":       input.Status,
			"action_taken": input.ActionTaken,
		},
	}

	return s.adminRepo.CreateModerationLog(ctx, log)
}

// User Moderation

func (s *AdminService) BanUser(ctx context.Context, adminID uuid.UUID, input *domain.BanUserInput) error {
	// Verify admin role
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil {
		return err
	}

	if admin.Role == nil || *admin.Role != domain.RoleAdmin {
		return fmt.Errorf("insufficient permissions: only admins can ban users")
	}

	// Ban the user
	if err := s.adminRepo.BanUser(ctx, input.UserID, adminID, input.Reason); err != nil {
		return err
	}

	// Log the action
	log := &domain.ModerationLog{
		ModeratorID: adminID,
		Action:      "banned_user",
		TargetType:  "user",
		TargetID:    input.UserID,
		Details: map[string]interface{}{
			"reason": input.Reason,
		},
	}

	return s.adminRepo.CreateModerationLog(ctx, log)
}

func (s *AdminService) UnbanUser(ctx context.Context, adminID, userID uuid.UUID) error {
	// Verify admin role
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil {
		return err
	}

	if admin.Role == nil || *admin.Role != domain.RoleAdmin {
		return fmt.Errorf("insufficient permissions: only admins can unban users")
	}

	// Unban the user
	if err := s.adminRepo.UnbanUser(ctx, userID); err != nil {
		return err
	}

	// Log the action
	log := &domain.ModerationLog{
		ModeratorID: adminID,
		Action:      "unbanned_user",
		TargetType:  "user",
		TargetID:    userID,
	}

	return s.adminRepo.CreateModerationLog(ctx, log)
}

func (s *AdminService) SuspendUser(ctx context.Context, moderatorID uuid.UUID, input *domain.CreateSuspensionInput) error {
	// Verify moderator role
	moderator, err := s.userRepo.GetByID(ctx, moderatorID)
	if err != nil {
		return err
	}

	if moderator.Role == nil || (*moderator.Role != domain.RoleModerator && *moderator.Role != domain.RoleAdmin) {
		return fmt.Errorf("insufficient permissions")
	}

	suspension := &domain.UserSuspension{
		UserID:      input.UserID,
		SuspendedBy: moderatorID,
		Reason:      input.Reason,
		ExpiresAt:   input.ExpiresAt,
		IsActive:    true,
	}

	if err := s.adminRepo.CreateSuspension(ctx, suspension); err != nil {
		return err
	}

	// Log the action
	log := &domain.ModerationLog{
		ModeratorID: moderatorID,
		Action:      "suspended_user",
		TargetType:  "user",
		TargetID:    input.UserID,
		Details: map[string]interface{}{
			"reason":     input.Reason,
			"expires_at": input.ExpiresAt,
		},
	}

	return s.adminRepo.CreateModerationLog(ctx, log)
}

func (s *AdminService) GetActiveSuspension(ctx context.Context, userID uuid.UUID) (*domain.UserSuspension, error) {
	return s.adminRepo.GetActiveSuspension(ctx, userID)
}

func (s *AdminService) LiftSuspension(ctx context.Context, moderatorID, suspensionID uuid.UUID) error {
	// Verify moderator role
	moderator, err := s.userRepo.GetByID(ctx, moderatorID)
	if err != nil {
		return err
	}

	if moderator.Role == nil || (*moderator.Role != domain.RoleModerator && *moderator.Role != domain.RoleAdmin) {
		return fmt.Errorf("insufficient permissions")
	}

	// Deactivate suspension
	if err := s.adminRepo.DeactivateSuspension(ctx, suspensionID); err != nil {
		return err
	}

	// Log the action
	log := &domain.ModerationLog{
		ModeratorID: moderatorID,
		Action:      "lifted_suspension",
		TargetType:  "suspension",
		TargetID:    suspensionID,
	}

	return s.adminRepo.CreateModerationLog(ctx, log)
}

// Admin Dashboard

func (s *AdminService) GetDashboardStats(ctx context.Context) (*domain.AdminStats, error) {
	return s.adminRepo.GetAdminStats(ctx)
}

func (s *AdminService) ListModerationLogs(ctx context.Context, page, limit int) ([]*domain.ModerationLog, int, error) {
	offset := (page - 1) * limit
	return s.adminRepo.ListModerationLogs(ctx, limit, offset)
}

// User Management

func (s *AdminService) ListUsers(ctx context.Context, page, limit int, filters map[string]interface{}) ([]*domain.User, int, error) {
	offset := (page - 1) * limit
	return s.adminRepo.ListUsers(ctx, limit, offset, filters)
}

func (s *AdminService) UpdateUserRole(ctx context.Context, adminID, userID uuid.UUID, role domain.UserRole) error {
	// Verify admin role
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil {
		return err
	}

	if admin.Role == nil || *admin.Role != domain.RoleAdmin {
		return fmt.Errorf("insufficient permissions: only admins can change user roles")
	}

	// Update role
	if err := s.adminRepo.UpdateUserRole(ctx, userID, role); err != nil {
		return err
	}

	// Log the action
	log := &domain.ModerationLog{
		ModeratorID: adminID,
		Action:      "changed_user_role",
		TargetType:  "user",
		TargetID:    userID,
		Details: map[string]interface{}{
			"new_role": role,
		},
	}

	return s.adminRepo.CreateModerationLog(ctx, log)
}

// Check if user has admin/moderator permissions
func (s *AdminService) IsAdmin(ctx context.Context, userID uuid.UUID) (bool, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return false, err
	}

	return user.Role != nil && *user.Role == domain.RoleAdmin, nil
}

func (s *AdminService) IsModerator(ctx context.Context, userID uuid.UUID) (bool, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return false, err
	}

	return user.Role != nil && (*user.Role == domain.RoleModerator || *user.Role == domain.RoleAdmin), nil
}
