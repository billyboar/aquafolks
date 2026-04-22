'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useAdminStats } from '@/lib/api/admin';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/admin');
    }
  }, [user, authLoading, router]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))] mx-auto"></div>
          <p className="mt-4 text-[hsl(var(--on-surface-variant))]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has admin or moderator role
  const hasAdminAccess = user.role === 'admin' || user.role === 'moderator';

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[hsl(var(--error))] mb-4">Access Denied</h1>
          <p className="text-[hsl(var(--on-surface-variant))] mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface))]">
      {/* Header */}
      <div className="bg-[hsl(var(--surface-container))] border-b border-[hsl(var(--outline-variant))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[hsl(var(--on-surface))]">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-[hsl(var(--on-surface-variant))]">
                Welcome back, {user.username} ({user.role})
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] transition-colors"
            >
              ← Back to Site
            </Link>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex space-x-4">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/reports"
              className="px-4 py-2 rounded-lg text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))] transition-colors"
            >
              Reports
              {stats && stats.pending_reports > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[hsl(var(--error))] rounded-full">
                  {stats.pending_reports}
                </span>
              )}
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin/users"
                className="px-4 py-2 rounded-lg text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))] transition-colors"
              >
                Users
              </Link>
            )}
            <Link
              href="/admin/logs"
              className="px-4 py-2 rounded-lg text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))] transition-colors"
            >
              Audit Logs
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-[hsl(var(--surface-container))] rounded-lg p-6 border border-[hsl(var(--outline-variant))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--on-surface-variant))]">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-[hsl(var(--on-surface))]">
                  {stats?.total_users || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-[hsl(var(--on-surface-variant))]">
              {stats?.active_users || 0} active this month
            </p>
          </div>

          {/* Pending Reports */}
          <div className="bg-[hsl(var(--surface-container))] rounded-lg p-6 border border-[hsl(var(--outline-variant))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--on-surface-variant))]">Pending Reports</p>
                <p className="mt-2 text-3xl font-bold text-[hsl(var(--error))]">
                  {stats?.pending_reports || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-[hsl(var(--on-surface-variant))]">
              {stats?.resolved_reports_today || 0} resolved today
            </p>
          </div>

          {/* Total Content */}
          <div className="bg-[hsl(var(--surface-container))] rounded-lg p-6 border border-[hsl(var(--outline-variant))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--on-surface-variant))]">Total Content</p>
                <p className="mt-2 text-3xl font-bold text-[hsl(var(--on-surface))]">
                  {(stats?.total_tanks || 0) + (stats?.total_listings || 0) + (stats?.total_projects || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-[hsl(var(--on-surface-variant))]">
              Tanks, listings, and projects
            </p>
          </div>

          {/* Moderation Status */}
          <div className="bg-[hsl(var(--surface-container))] rounded-lg p-6 border border-[hsl(var(--outline-variant))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--on-surface-variant))]">Banned Users</p>
                <p className="mt-2 text-3xl font-bold text-[hsl(var(--on-surface))]">
                  {stats?.banned_users || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-[hsl(var(--on-surface-variant))]">
              {stats?.suspended_users || 0} suspended users
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <div className="bg-[hsl(var(--surface-container))] rounded-lg p-6 border border-[hsl(var(--outline-variant))]">
            <h2 className="text-lg font-semibold text-[hsl(var(--on-surface))] mb-4">User Growth</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--on-surface-variant))]">Today</span>
                <span className="text-lg font-semibold text-[hsl(var(--on-surface))]">
                  {stats?.new_users_today || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--on-surface-variant))]">This Week</span>
                <span className="text-lg font-semibold text-[hsl(var(--on-surface))]">
                  {stats?.new_users_this_week || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--on-surface-variant))]">This Month</span>
                <span className="text-lg font-semibold text-[hsl(var(--on-surface))]">
                  {stats?.new_users_this_month || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="bg-[hsl(var(--surface-container))] rounded-lg p-6 border border-[hsl(var(--outline-variant))]">
            <h2 className="text-lg font-semibold text-[hsl(var(--on-surface))] mb-4">Content Breakdown</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--on-surface-variant))]">🐠 Tanks</span>
                <span className="text-lg font-semibold text-[hsl(var(--on-surface))]">
                  {stats?.total_tanks || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--on-surface-variant))]">🏪 Listings</span>
                <span className="text-lg font-semibold text-[hsl(var(--on-surface))]">
                  {stats?.total_listings || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--on-surface-variant))]">📝 Projects</span>
                <span className="text-lg font-semibold text-[hsl(var(--on-surface))]">
                  {stats?.total_projects || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-[hsl(var(--surface-container))] rounded-lg p-6 border border-[hsl(var(--outline-variant))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--on-surface))] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/reports"
              className="flex items-center p-4 bg-[hsl(var(--surface-container-high))] rounded-lg hover:bg-[hsl(var(--surface-container-highest))] transition-colors"
            >
              <span className="text-2xl mr-3">📋</span>
              <div>
                <p className="font-medium text-[hsl(var(--on-surface))]">Review Reports</p>
                <p className="text-xs text-[hsl(var(--on-surface-variant))]">
                  {stats?.pending_reports || 0} pending
                </p>
              </div>
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin/users"
                className="flex items-center p-4 bg-[hsl(var(--surface-container-high))] rounded-lg hover:bg-[hsl(var(--surface-container-highest))] transition-colors"
              >
                <span className="text-2xl mr-3">👤</span>
                <div>
                  <p className="font-medium text-[hsl(var(--on-surface))]">Manage Users</p>
                  <p className="text-xs text-[hsl(var(--on-surface-variant))]">
                    {stats?.total_users || 0} total users
                  </p>
                </div>
              </Link>
            )}

            <Link
              href="/admin/logs"
              className="flex items-center p-4 bg-[hsl(var(--surface-container-high))] rounded-lg hover:bg-[hsl(var(--surface-container-highest))] transition-colors"
            >
              <span className="text-2xl mr-3">📜</span>
              <div>
                <p className="font-medium text-[hsl(var(--on-surface))]">View Audit Logs</p>
                <p className="text-xs text-[hsl(var(--on-surface-variant))]">Recent activity</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
