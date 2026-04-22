import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper to handle 401 errors
function handle401(status: number) {
  if (status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
}

// Types
export type ReportableType = 'user' | 'tank' | 'post' | 'comment' | 'listing' | 'project' | 'project_update' | 'message';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'fake_listing' | 'misinformation' | 'copyright' | 'animal_abuse' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type ModerationAction = 'ban_user' | 'unban_user' | 'suspend_user' | 'update_role' | 'resolve_report' | 'dismiss_report';

export interface AdminStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  suspended_users: number;
  total_tanks: number;
  total_listings: number;
  total_projects: number;
  pending_reports: number;
  resolved_reports_today: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reportable_type: ReportableType;
  reportable_id: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  moderator_id?: string;
  moderator_note?: string;
  action_taken?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  reporter_username?: string;
  reviewed_by_username?: string;
  reviewed_at?: string;
}

export interface ModerationLog {
  id: string;
  moderator_id: string;
  moderator_username?: string;
  target_user_id?: string;
  target_user_username?: string;
  action: ModerationAction;
  reason?: string;
  metadata?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location_city?: string;
  role: 'user' | 'moderator' | 'admin';
  is_banned: boolean;
  banned_at?: string;
  banned_reason?: string;
  created_at: string;
}

export interface CreateReportInput {
  reported_user_id?: string;
  reportable_type: ReportableType;
  reportable_id: string;
  reason: ReportReason;
  description?: string;
}

export interface UpdateReportInput {
  status?: ReportStatus;
  moderator_note?: string;
  action_taken?: string;
}

export interface BanUserInput {
  reason: string;
}

export interface SuspendUserInput {
  reason: string;
  duration_hours: number;
}

// Hooks

// Admin Stats
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return res.json();
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: 1,
  });
}

// Reports
export function useReports(params?: { page?: number; limit?: number; status?: ReportStatus }) {
  const { page = 1, limit = 20, status } = params || {};
  return useQuery({
    queryKey: ['admin', 'reports', page, limit, status],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) queryParams.append('status', status);

      const res = await fetch(`${API_URL}/api/v1/admin/reports?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: 1,
  });
}

export function useReport(id: string) {
  return useQuery<Report>({
    queryKey: ['admin', 'reports', id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/admin/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token') && !!id,
    retry: 1,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to create report');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, moderator_note }: { id: string; status?: ReportStatus; moderator_note?: string }) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/admin/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, moderator_note }),
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to update report');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// Users
export function useAdminUsers(params?: { page?: number; limit?: number; role?: string; is_banned?: boolean; search?: string }) {
  const { page = 1, limit = 20, role, is_banned, search } = params || {};
  return useQuery({
    queryKey: ['admin', 'users', page, limit, role, is_banned, search],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (role) queryParams.append('role', role);
      if (is_banned !== undefined) queryParams.append('is_banned', is_banned.toString());
      if (search) queryParams.append('search', search);

      const res = await fetch(`${API_URL}/api/v1/admin/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: 1,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to update user role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to ban user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/ban`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to unban user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, duration_hours, reason }: { userId: string; duration_hours: number; reason: string }) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration_hours, reason }),
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to suspend user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// Moderation Logs
export function useModerationLogs(params?: { page?: number; limit?: number; action?: ModerationAction }) {
  const { page = 1, limit = 50, action } = params || {};
  return useQuery({
    queryKey: ['admin', 'logs', page, limit, action],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (action) queryParams.append('action', action);

      const res = await fetch(`${API_URL}/api/v1/admin/logs?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to fetch moderation logs');
      return res.json();
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: 1,
  });
}
