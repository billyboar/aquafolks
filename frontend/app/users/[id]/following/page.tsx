'use client';

import { useAuth } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFollowing, useFollowUser, useUnfollowUser, type FollowUser } from '@/lib/api/follow';
import Header from '@/components/Header';
import Link from 'next/link';

export default function FollowingPage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useFollowing(userId, page, 20);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const handleFollowToggle = async (followUserId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(followUserId);
      } else {
        await followUser.mutateAsync(followUserId);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-text-secondary">Loading following...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm mb-6">
            Failed to load following
          </div>
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline"
          >
            ← Go Back
          </button>
        </div>
      </>
    );
  }

  const following = data?.following ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline mb-2 inline-block"
          >
            ← Back to Profile
          </button>
          <h1 className="text-3xl font-bold">Following</h1>
          <p className="text-text-secondary mt-1">
            {total} {total === 1 ? 'user' : 'users'}
          </p>
        </div>

        {/* Following List */}
        {following.length === 0 ? (
          <div className="bg-surface rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-text-secondary">Not following anyone yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {following.map((user: FollowUser) => (
              <div
                key={user.id}
                className="bg-surface rounded-lg p-4 flex items-center justify-between border border-border hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <Link href={`/users/${user.id}`}>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold flex-shrink-0">
                      {user.display_name?.[0]?.toUpperCase() ||
                        user.username?.[0]?.toUpperCase() ||
                        'U'}
                    </div>
                  </Link>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/users/${user.id}`}
                      className="font-semibold hover:underline block truncate"
                    >
                      {user.display_name || user.username}
                    </Link>
                    <p className="text-sm text-text-secondary truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Follow Button */}
                {currentUser && currentUser.id !== user.id && (
                  <button
                    onClick={() => handleFollowToggle(user.id, user.is_following)}
                    disabled={followUser.isPending || unfollowUser.isPending}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ml-4 flex-shrink-0 ${
                      user.is_following
                        ? 'bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))] hover:bg-[hsl(var(--primary-container)/0.8)]'
                        : 'bg-[hsl(var(--primary))] text-[hsl(var(--on-primary))] hover:bg-[hsl(var(--primary)/0.9)]'
                    }`}
                  >
                    {user.is_following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-surface border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 flex items-center text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-surface border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
