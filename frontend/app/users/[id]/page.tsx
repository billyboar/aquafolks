'use client';

import { useAuth } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import type { User, Tank, Project } from '@/lib/types';
import { useFollowUser, useUnfollowUser, useFollowStats } from '@/lib/api/follow';

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Follow hooks
  const { data: followStats, isLoading: followStatsLoading } = useFollowStats(userId);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      // Load user details
      const userResponse = await api.get(`/api/v1/users/${userId}`);
      setUser(userResponse.data.user);

      // Load user's tanks
      const tanksResponse = await api.get(`/api/v1/tanks?user_id=${userId}`);
      setTanks(tanksResponse.data.tanks || []);

      // Load user's active projects
      const projectsResponse = await api.get(`/api/v1/projects?user_id=${userId}`);
      setProjects(projectsResponse.data.projects || []);
    } catch (err: any) {
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (liters: number) => {
    const gallons = liters / 3.78541;
    return { gallons: gallons.toFixed(1), liters: liters.toFixed(1) };
  };

  const getTankTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      freshwater: 'Freshwater',
      planted: 'Planted',
      saltwater: 'Saltwater',
      reef: 'Reef',
      brackish: 'Brackish',
    };
    return labels[type] || type;
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breeding: 'Breeding',
      aquascaping: 'Aquascaping',
      disease_treatment: 'Disease Treatment',
      equipment_diy: 'Equipment DIY',
      species_care: 'Species Care',
      biotope: 'Biotope',
    };
    return labels[type] || type;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planning',
      in_progress: 'In Progress',
      completed: 'Completed',
      on_hold: 'On Hold',
      abandoned: 'Abandoned',
    };
    return labels[status] || status;
  };

  const handleFollowToggle = async () => {
    try {
      if (followStats?.is_following) {
        await unfollowUser.mutateAsync(userId);
      } else {
        await followUser.mutateAsync(userId);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm mb-6">
            {error || 'User not found'}
          </div>
          <Link href="/explore" className="text-primary hover:underline">
            ← Back to Explore
          </Link>
        </div>
      </>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-surface rounded-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {user.display_name?.[0]?.toUpperCase() ||
                  user.username?.[0]?.toUpperCase() ||
                  'U'}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    {user.display_name || user.username}
                  </h1>
                  <p className="text-text-secondary">@{user.username}</p>
                </div>

                {isOwnProfile ? (
                  <Link
                    href="/settings"
                    className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover transition-colors"
                  >
                    Edit Profile
                  </Link>
                ) : currentUser ? (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followStatsLoading || followUser.isPending || unfollowUser.isPending}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      followStats?.is_following
                        ? 'bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))] hover:bg-[hsl(var(--primary-container)/0.8)]'
                        : 'bg-[hsl(var(--primary))] text-[hsl(var(--on-primary))] hover:bg-[hsl(var(--primary)/0.9)]'
                    }`}
                  >
                    {followStats?.is_following ? (
                      <>
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Following
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Follow
                      </>
                    )}
                  </button>
                ) : null}
              </div>

              {user.bio && (
                <p className="text-text mb-4 whitespace-pre-wrap">{user.bio}</p>
              )}

              {/* Follower/Following counts */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <Link
                  href={`/users/${userId}/followers`}
                  className="hover:underline"
                >
                  <span className="font-semibold text-text">
                    {followStats?.follower_count ?? 0}
                  </span>{' '}
                  <span className="text-text-secondary">
                    {followStats?.follower_count === 1 ? 'Follower' : 'Followers'}
                  </span>
                </Link>
                <Link
                  href={`/users/${userId}/following`}
                  className="hover:underline"
                >
                  <span className="font-semibold text-text">
                    {followStats?.following_count ?? 0}
                  </span>{' '}
                  <span className="text-text-secondary">Following</span>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-sm text-text-secondary">
                {user.location_city && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    <span>
                      {user.location_city}
                      {user.location_state && `, ${user.location_state}`}
                      {user.location_country && `, ${user.location_country}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                  <span>
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Tanks */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {isOwnProfile ? 'My Tanks' : `${user.display_name || user.username}'s Tanks`}
          </h2>

          {tanks.length === 0 ? (
            <div className="bg-surface rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🐠</div>
              <p className="text-text-secondary mb-4">
                {isOwnProfile
                  ? "You haven't added any tanks yet"
                  : 'This user has no tanks yet'}
              </p>
              {isOwnProfile && (
                <Link
                  href="/tanks/new"
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Add Your First Tank
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tanks.map((tank) => {
                const volume = formatVolume(tank.volume_liters);
                const primaryPhoto = tank.photos?.find((p) => p.is_primary) || tank.photos?.[0];

                return (
                  <Link
                    key={tank.id}
                    href={`/tanks/${tank.id}`}
                    className="bg-surface rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-border"
                  >
                    {/* Tank Image */}
                    <div className="aspect-video relative bg-gradient-to-br from-primary/10 to-secondary/10">
                      {primaryPhoto ? (
                        <Image
                          src={primaryPhoto.url}
                          alt={tank.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-5xl">🐠</div>
                        </div>
                      )}
                    </div>

                    {/* Tank Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                        {tank.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {getTankTypeLabel(tank.tank_type)}
                        </span>
                        <span>💧 {volume.gallons} gal</span>
                      </div>
                      {tank.description && (
                        <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                          {tank.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* User's Projects */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {isOwnProfile ? 'My Projects' : `${user.display_name || user.username}'s Projects`}
          </h2>

          {projects.length === 0 ? (
            <div className="bg-surface rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔬</div>
              <p className="text-text-secondary mb-4">
                {isOwnProfile
                  ? "You haven't started any projects yet"
                  : 'This user has no projects yet'}
              </p>
              {isOwnProfile && (
                <Link
                  href="/projects/new"
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Start Your First Project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-surface rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
                >
                  {/* Project Image */}
                  <div className="h-48 relative bg-gradient-to-br from-primary/10 to-secondary/10">
                    {project.cover_photo_url ? (
                      <Image
                        src={project.cover_photo_url}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <div className="text-6xl">🔬</div>
                      </div>
                    )}
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/90 text-gray-800">
                        {getProjectTypeLabel(project.project_type)}
                      </span>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1 flex-1">
                        {project.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 whitespace-nowrap ${getStatusBadgeColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
