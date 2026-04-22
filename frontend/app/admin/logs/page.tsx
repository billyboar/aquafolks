'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useModerationLogs, type ModerationAction } from '@/lib/api/admin';

export default function AdminLogs() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [actionFilter, setActionFilter] = useState<ModerationAction | 'all'>('all');

  const { data, isLoading } = useModerationLogs({
    action: actionFilter === 'all' ? undefined : actionFilter,
  });

  // Check if user has access
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    router.push('/');
    return null;
  }

  const logs = data?.logs || [];

  const getActionBadge = (action: ModerationAction) => {
    const colors = {
      ban_user: 'bg-red-100 text-red-800',
      unban_user: 'bg-green-100 text-green-800',
      suspend_user: 'bg-orange-100 text-orange-800',
      update_role: 'bg-blue-100 text-blue-800',
      resolve_report: 'bg-purple-100 text-purple-800',
      dismiss_report: 'bg-gray-100 text-gray-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: ModerationAction) => {
    const labels = {
      ban_user: 'Ban User',
      unban_user: 'Unban User',
      suspend_user: 'Suspend User',
      update_role: 'Update Role',
      resolve_report: 'Resolve Report',
      dismiss_report: 'Dismiss Report',
    };
    return labels[action] || action;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Moderation Logs</h1>
              <p className="text-gray-600 mt-1">View audit trail of all moderation actions</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Action Type:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as ModerationAction | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="ban_user">Ban User</option>
              <option value="unban_user">Unban User</option>
              <option value="suspend_user">Suspend User</option>
              <option value="update_role">Update Role</option>
              <option value="resolve_report">Resolve Report</option>
              <option value="dismiss_report">Dismiss Report</option>
            </select>
          </div>
        </div>

        {/* Logs Timeline */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">No moderation logs found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Moderator:</span>
                        <span className="text-gray-900">{log.moderator_username}</span>
                      </div>

                      {log.target_user_username && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Target User:</span>
                          <span className="text-gray-900">{log.target_user_username}</span>
                        </div>
                      )}

                      {log.reason && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700">Reason:</span>
                          <span className="text-gray-900">{log.reason}</span>
                        </div>
                      )}

                      {log.metadata && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-700 text-xs mb-1">Additional Details:</div>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
