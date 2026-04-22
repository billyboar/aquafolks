import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  followed_at: string;
  is_following: boolean;
  is_follower: boolean;
}

export interface FollowStats {
  follower_count: number;
  following_count: number;
  is_following: boolean;
  is_followed_by: boolean;
}

export interface FollowersResponse {
  followers: FollowUser[];
  total: number;
  page: number;
  limit: number;
}

export interface FollowingResponse {
  following: FollowUser[];
  total: number;
  page: number;
  limit: number;
}

// Helper to handle 401 errors
function handle401(status: number) {
  if (status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
}

// Follow a user
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to follow user');
      return res.json();
    },
    onSuccess: (_, userId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['follow-stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// Unfollow a user
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/v1/users/${userId}/follow`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handle401(res.status);
      if (!res.ok) throw new Error('Failed to unfollow user');
      return res.json();
    },
    onSuccess: (_, userId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['follow-stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// Get followers list
export function useFollowers(userId: string, page = 1, limit = 20) {
  return useQuery<FollowersResponse>({
    queryKey: ['followers', userId, page, limit],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/v1/users/${userId}/followers?page=${page}&limit=${limit}`
      );

      if (!res.ok) throw new Error('Failed to fetch followers');
      return res.json();
    },
    enabled: !!userId,
  });
}

// Get following list
export function useFollowing(userId: string, page = 1, limit = 20) {
  return useQuery<FollowingResponse>({
    queryKey: ['following', userId, page, limit],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/v1/users/${userId}/following?page=${page}&limit=${limit}`
      );

      if (!res.ok) throw new Error('Failed to fetch following');
      return res.json();
    },
    enabled: !!userId,
  });
}

// Get follow stats
export function useFollowStats(userId: string) {
  return useQuery<FollowStats>({
    queryKey: ['follow-stats', userId],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/v1/users/${userId}/follow-stats`
      );

      if (!res.ok) throw new Error('Failed to fetch follow stats');
      return res.json();
    },
    enabled: !!userId,
  });
}
