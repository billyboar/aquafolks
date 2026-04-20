package postgres

import (
	"context"
	"encoding/json"

	"aquabook/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepository struct {
	db *pgxpool.Pool
}

func NewAdminRepository(db *pgxpool.Pool) *AdminRepository {
	return &AdminRepository{db: db}
}

// Reports

func (r *AdminRepository) CreateReport(ctx context.Context, report *domain.Report) error {
	query := `
		INSERT INTO reports (
			reporter_id, reported_user_id, reportable_type, reportable_id,
			reason, description, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(ctx, query,
		report.ReporterID,
		report.ReportedUserID,
		report.ReportableType,
		report.ReportableID,
		report.Reason,
		report.Description,
		report.Status,
	).Scan(&report.ID, &report.CreatedAt, &report.UpdatedAt)
}

func (r *AdminRepository) GetReportByID(ctx context.Context, id uuid.UUID) (*domain.Report, error) {
	query := `
		SELECT 
			r.id, r.reporter_id, r.reported_user_id, r.reportable_type, r.reportable_id,
			r.reason, r.description, r.status, r.moderator_id, r.moderator_note,
			r.action_taken, r.resolved_at, r.created_at, r.updated_at,
			reporter.id, reporter.username, reporter.email, reporter.avatar_url,
			reported.id, reported.username, reported.email, reported.avatar_url
		FROM reports r
		LEFT JOIN users reporter ON r.reporter_id = reporter.id
		LEFT JOIN users reported ON r.reported_user_id = reported.id
		WHERE r.id = $1
	`

	var report domain.Report
	var reporter, reported domain.User
	var reportedUserID *uuid.UUID
	var reportedUsername, reportedEmail, reportedAvatar *string

	err := r.db.QueryRow(ctx, query, id).Scan(
		&report.ID,
		&report.ReporterID,
		&reportedUserID,
		&report.ReportableType,
		&report.ReportableID,
		&report.Reason,
		&report.Description,
		&report.Status,
		&report.ModeratorID,
		&report.ModeratorNote,
		&report.ActionTaken,
		&report.ResolvedAt,
		&report.CreatedAt,
		&report.UpdatedAt,
		&reporter.ID,
		&reporter.Username,
		&reporter.Email,
		&reporter.AvatarURL,
		&reportedUserID,
		&reportedUsername,
		&reportedEmail,
		&reportedAvatar,
	)

	if err != nil {
		return nil, err
	}

	report.Reporter = &reporter
	if reportedUserID != nil {
		reported.ID = *reportedUserID
		if reportedUsername != nil {
			reported.Username = *reportedUsername
		}
		if reportedEmail != nil {
			reported.Email = *reportedEmail
		}
		if reportedAvatar != nil {
			reported.AvatarURL = reportedAvatar
		}
		report.ReportedUser = &reported
		report.ReportedUserID = reportedUserID
	}

	return &report, nil
}

func (r *AdminRepository) ListReports(ctx context.Context, status *domain.ReportStatus, limit, offset int) ([]*domain.Report, int, error) {
	// Count total
	countQuery := `SELECT COUNT(*) FROM reports WHERE ($1::text IS NULL OR status = $1)`
	var total int
	var statusStr *string
	if status != nil {
		s := string(*status)
		statusStr = &s
	}
	err := r.db.QueryRow(ctx, countQuery, statusStr).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get reports
	query := `
		SELECT 
			r.id, r.reporter_id, r.reported_user_id, r.reportable_type, r.reportable_id,
			r.reason, r.description, r.status, r.moderator_id, r.moderator_note,
			r.action_taken, r.resolved_at, r.created_at, r.updated_at,
			reporter.username, reporter.avatar_url
		FROM reports r
		LEFT JOIN users reporter ON r.reporter_id = reporter.id
		WHERE ($1::text IS NULL OR status = $1)
		ORDER BY r.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, statusStr, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reports []*domain.Report
	for rows.Next() {
		var report domain.Report
		var reporterUsername, reporterAvatar *string

		err := rows.Scan(
			&report.ID,
			&report.ReporterID,
			&report.ReportedUserID,
			&report.ReportableType,
			&report.ReportableID,
			&report.Reason,
			&report.Description,
			&report.Status,
			&report.ModeratorID,
			&report.ModeratorNote,
			&report.ActionTaken,
			&report.ResolvedAt,
			&report.CreatedAt,
			&report.UpdatedAt,
			&reporterUsername,
			&reporterAvatar,
		)
		if err != nil {
			return nil, 0, err
		}

		if reporterUsername != nil {
			report.Reporter = &domain.User{
				ID:        report.ReporterID,
				Username:  *reporterUsername,
				AvatarURL: reporterAvatar,
			}
		}

		reports = append(reports, &report)
	}

	return reports, total, nil
}

func (r *AdminRepository) UpdateReport(ctx context.Context, id uuid.UUID, moderatorID uuid.UUID, update *domain.UpdateReportInput) error {
	query := `
		UPDATE reports
		SET status = $1, moderator_note = $2, action_taken = $3, 
		    moderator_id = $4, resolved_at = CASE WHEN $1 IN ('resolved', 'dismissed') THEN NOW() ELSE resolved_at END
		WHERE id = $5
	`

	_, err := r.db.Exec(ctx, query,
		update.Status,
		update.ModeratorNote,
		update.ActionTaken,
		moderatorID,
		id,
	)
	return err
}

// User Moderation

func (r *AdminRepository) BanUser(ctx context.Context, userID, bannedBy uuid.UUID, reason string) error {
	query := `
		UPDATE users
		SET is_banned = TRUE, banned_at = NOW(), banned_reason = $1, banned_by = $2
		WHERE id = $3
	`

	_, err := r.db.Exec(ctx, query, reason, bannedBy, userID)
	return err
}

func (r *AdminRepository) UnbanUser(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE users
		SET is_banned = FALSE, banned_at = NULL, banned_reason = NULL, banned_by = NULL
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *AdminRepository) CreateSuspension(ctx context.Context, suspension *domain.UserSuspension) error {
	query := `
		INSERT INTO user_suspensions (user_id, suspended_by, reason, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, suspended_at, created_at
	`

	return r.db.QueryRow(ctx, query,
		suspension.UserID,
		suspension.SuspendedBy,
		suspension.Reason,
		suspension.ExpiresAt,
	).Scan(&suspension.ID, &suspension.SuspendedAt, &suspension.CreatedAt)
}

func (r *AdminRepository) GetActiveSuspension(ctx context.Context, userID uuid.UUID) (*domain.UserSuspension, error) {
	query := `
		SELECT id, user_id, suspended_by, reason, suspended_at, expires_at, is_active, created_at
		FROM user_suspensions
		WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW()
		ORDER BY created_at DESC
		LIMIT 1
	`

	var suspension domain.UserSuspension
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&suspension.ID,
		&suspension.UserID,
		&suspension.SuspendedBy,
		&suspension.Reason,
		&suspension.SuspendedAt,
		&suspension.ExpiresAt,
		&suspension.IsActive,
		&suspension.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &suspension, nil
}

func (r *AdminRepository) DeactivateSuspension(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE user_suspensions SET is_active = FALSE WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// Moderation Logs

func (r *AdminRepository) CreateModerationLog(ctx context.Context, log *domain.ModerationLog) error {
	detailsJSON, err := json.Marshal(log.Details)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO moderation_logs (moderator_id, action, target_type, target_id, details)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`

	return r.db.QueryRow(ctx, query,
		log.ModeratorID,
		log.Action,
		log.TargetType,
		log.TargetID,
		detailsJSON,
	).Scan(&log.ID, &log.CreatedAt)
}

func (r *AdminRepository) ListModerationLogs(ctx context.Context, limit, offset int) ([]*domain.ModerationLog, int, error) {
	// Count total
	countQuery := `SELECT COUNT(*) FROM moderation_logs`
	var total int
	err := r.db.QueryRow(ctx, countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get logs
	query := `
		SELECT 
			ml.id, ml.moderator_id, ml.action, ml.target_type, ml.target_id, ml.details, ml.created_at,
			m.username, m.avatar_url
		FROM moderation_logs ml
		LEFT JOIN users m ON ml.moderator_id = m.id
		ORDER BY ml.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []*domain.ModerationLog
	for rows.Next() {
		var log domain.ModerationLog
		var detailsJSON []byte
		var modUsername, modAvatar *string

		err := rows.Scan(
			&log.ID,
			&log.ModeratorID,
			&log.Action,
			&log.TargetType,
			&log.TargetID,
			&detailsJSON,
			&log.CreatedAt,
			&modUsername,
			&modAvatar,
		)
		if err != nil {
			return nil, 0, err
		}

		if len(detailsJSON) > 0 {
			json.Unmarshal(detailsJSON, &log.Details)
		}

		if modUsername != nil {
			log.Moderator = &domain.User{
				ID:        log.ModeratorID,
				Username:  *modUsername,
				AvatarURL: modAvatar,
			}
		}

		logs = append(logs, &log)
	}

	return logs, total, nil
}

// Admin Stats

func (r *AdminRepository) GetAdminStats(ctx context.Context) (*domain.AdminStats, error) {
	var stats domain.AdminStats

	query := `
		SELECT 
			(SELECT COUNT(*) FROM users) as total_users,
			(SELECT COUNT(*) FROM users WHERE updated_at > NOW() - INTERVAL '30 days') as active_users,
			(SELECT COUNT(*) FROM users WHERE is_banned = TRUE) as banned_users,
			(SELECT COUNT(DISTINCT user_id) FROM user_suspensions WHERE is_active = TRUE AND expires_at > NOW()) as suspended_users,
			(SELECT COUNT(*) FROM tanks) as total_tanks,
			(SELECT COUNT(*) FROM marketplace_listings) as total_listings,
			(SELECT COUNT(*) FROM projects) as total_projects,
			(SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
			(SELECT COUNT(*) FROM reports WHERE status IN ('resolved', 'dismissed') AND resolved_at::date = CURRENT_DATE) as resolved_reports_today,
			(SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE) as new_users_today,
			(SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_this_week,
			(SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_this_month
	`

	err := r.db.QueryRow(ctx, query).Scan(
		&stats.TotalUsers,
		&stats.ActiveUsers,
		&stats.BannedUsers,
		&stats.SuspendedUsers,
		&stats.TotalTanks,
		&stats.TotalListings,
		&stats.TotalProjects,
		&stats.PendingReports,
		&stats.ResolvedReportsToday,
		&stats.NewUsersToday,
		&stats.NewUsersThisWeek,
		&stats.NewUsersThisMonth,
	)

	return &stats, err
}

// User Management

func (r *AdminRepository) ListUsers(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*domain.User, int, error) {
	// Build query based on filters
	baseQuery := `FROM users WHERE 1=1`
	args := []interface{}{}
	argCount := 1

	if role, ok := filters["role"].(string); ok && role != "" {
		baseQuery += ` AND role = $` + string(rune('0'+argCount))
		args = append(args, role)
		argCount++
	}

	if banned, ok := filters["is_banned"].(bool); ok {
		baseQuery += ` AND is_banned = $` + string(rune('0'+argCount))
		args = append(args, banned)
		argCount++
	}

	// Count total
	countQuery := `SELECT COUNT(*) ` + baseQuery
	var total int
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get users
	selectQuery := `
		SELECT id, username, email, avatar_url, bio, location_city, role, is_banned, 
		       banned_at, banned_reason, created_at
		` + baseQuery + `
		ORDER BY created_at DESC
		LIMIT $` + string(rune('0'+argCount)) + ` OFFSET $` + string(rune('0'+argCount+1))

	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var user domain.User
		var locationCity *string
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.AvatarURL,
			&user.Bio,
			&locationCity,
			&user.Role,
			&user.IsBanned,
			&user.BannedAt,
			&user.BannedReason,
			&user.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		user.LocationCity = locationCity
		users = append(users, &user)
	}

	return users, total, nil
}

func (r *AdminRepository) UpdateUserRole(ctx context.Context, userID uuid.UUID, role domain.UserRole) error {
	query := `UPDATE users SET role = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, role, userID)
	return err
}
