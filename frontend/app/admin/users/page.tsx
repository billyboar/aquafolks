'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  useAdminUsers,
  useUpdateUserRole,
  useBanUser,
  useUnbanUser,
  useSuspendUser,
  type AdminUser,
} from '@/lib/api/admin';

export default function AdminUsers() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [bannedFilter, setBannedFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<'role' | 'ban' | 'suspend' | null>(null);
  const [newRole, setNewRole] = useState<string>('user');
  const [banReason, setBanReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('24');
  const [suspendReason, setSuspendReason] = useState('');

  const { data, isLoading, refetch } = useAdminUsers({
    search: search || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    is_banned: bannedFilter === 'all' ? undefined : bannedFilter === 'banned',
  });

  const updateRole = useUpdateUserRole();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const suspendUser = useSuspendUser();

  // Check if user has access
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    router.push('/');
    return null;
  }

  const users = data?.users || [];

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await updateRole.mutateAsync({ userId: selectedUser.id, role: newRole });
      setSelectedUser(null);
      setActionType(null);
      refetch();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role. Please try again.');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      await banUser.mutateAsync({
        userId: selectedUser.id,
        reason: banReason,
      });
      setBanReason('');
      setSelectedUser(null);
      setActionType(null);
      refetch();
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user. Please try again.');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await unbanUser.mutateAsync({ userId });
      refetch();
    } catch (error) {
      console.error('Failed to unban user:', error);
      alert('Failed to unban user. Please try again.');
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    try {
      await suspendUser.mutateAsync({
        userId: selectedUser.id,
        duration_hours: parseInt(suspendDuration),
        reason: suspendReason,
      });
      setSuspendReason('');
      setSelectedUser(null);
      setActionType(null);
      refetch();
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Failed to suspend user. Please try again.');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage user roles, bans, and suspensions</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Username or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={bannedFilter}
                onChange={(e) => setBannedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">No users found</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{u.username}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.role || 'user')}`}>
                        {(u.role || 'user').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.is_banned ? (
                        <div>
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            BANNED
                          </span>
                          {u.banned_reason && (
                            <div className="text-xs text-gray-500 mt-1">{u.banned_reason}</div>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewRole(u.role || 'user');
                            setActionType('role');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Change Role
                        </button>
                        {u.is_banned ? (
                          <button
                            onClick={() => handleUnbanUser(u.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Unban
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('ban');
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Ban
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('suspend');
                              }}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Suspend
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Modal */}
        {selectedUser && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {actionType === 'role' && 'Change User Role'}
                {actionType === 'ban' && 'Ban User'}
                {actionType === 'suspend' && 'Suspend User'}
              </h3>

              {actionType === 'role' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              {actionType === 'ban' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ban Reason
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Explain why this user is being banned..."
                  />
                </div>
              )}

              {actionType === 'suspend' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={suspendDuration}
                      onChange={(e) => setSuspendDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suspension Reason
                    </label>
                    <textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Explain why this user is being suspended..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setActionType(null);
                    setBanReason('');
                    setSuspendReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (actionType === 'role') handleUpdateRole();
                    if (actionType === 'ban') handleBanUser();
                    if (actionType === 'suspend') handleSuspendUser();
                  }}
                  disabled={
                    updateRole.isPending || banUser.isPending || suspendUser.isPending
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionType === 'role' && 'Update Role'}
                  {actionType === 'ban' && 'Ban User'}
                  {actionType === 'suspend' && 'Suspend User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
