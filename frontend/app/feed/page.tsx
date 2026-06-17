'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { Tank, Project, ProjectStatus } from '@/lib/types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  abandoned: 'Abandoned',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  abandoned: 'bg-red-100 text-red-700',
};

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [recentTanks, setRecentTanks] = useState<Tank[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setFeedLoading(true);

    Promise.all([
      // My projects
      api.get<{ projects: Project[] }>(`/api/v1/projects?user_id=${user.id}`),
      // Recent community tanks
      api.get('/api/v1/tanks', { params: { limit: 6 } }),
      // Recent community projects
      api.get('/api/v1/projects', { params: { limit: 6 } }),
    ])
      .then(async ([myProjRes, tanksRes, projRes]) => {
        setMyProjects(myProjRes.data.projects || []);
        setRecentProjects(projRes.data.projects || []);

        // Load cover photos for tanks
        const tanksData: Tank[] = tanksRes.data.tanks || [];
        const tanksWithPhotos = await Promise.all(
          tanksData.map(async (tank) => {
            try {
              const photosRes = await api.get(`/api/v1/tanks/${tank.id}/photos`);
              return { ...tank, photos: photosRes.data || [] };
            } catch {
              return tank;
            }
          })
        );
        setRecentTanks(tanksWithPhotos);
      })
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, [user]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[hsl(var(--on-surface-variant))]">Loading...</p>
        </div>
      </>
    );
  }

  if (!user) return null;

  const activeProjects = myProjects.filter(
    (p) => p.status === 'in_progress' || p.status === 'planning'
  );
  const otherProjects = myProjects.filter(
    (p) => p.status !== 'in_progress' && p.status !== 'planning'
  );
  const displayMyProjects = [...activeProjects, ...otherProjects];

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.display_name || user.username}!
          </h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Here's what's happening in the AquaFolks community.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link
            href="/tanks/new"
            className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🐠
              </div>
              <div>
                <h3 className="font-semibold">Add a Tank</h3>
                <p className="text-sm text-[hsl(var(--on-surface-variant))]">Share your setup</p>
              </div>
            </div>
          </Link>

          <Link
            href="/projects/new"
            className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📝
              </div>
              <div>
                <h3 className="font-semibold">Start a Project</h3>
                <p className="text-sm text-[hsl(var(--on-surface-variant))]">Document your journey</p>
              </div>
            </div>
          </Link>

          <Link
            href="/explore"
            className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🔍
              </div>
              <div>
                <h3 className="font-semibold">Explore Tanks</h3>
                <p className="text-sm text-[hsl(var(--on-surface-variant))]">Discover setups</p>
              </div>
            </div>
          </Link>
        </div>

        {/* My Projects */}
        <section className="mb-10" id="my-projects">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Projects</h2>
            <Link
              href={`/users/${user.id}`}
              className="text-sm text-[hsl(var(--primary))] hover:underline"
            >
              View all
            </Link>
          </div>

          {feedLoading ? (
            <div className="text-center py-6 text-[hsl(var(--on-surface-variant))]">Loading...</div>
          ) : displayMyProjects.length === 0 ? (
            <div className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-8 text-center border border-[hsl(var(--outline-variant))]">
              <div className="text-4xl mb-3">🌿</div>
              <p className="text-[hsl(var(--on-surface-variant))] mb-4">
                You have no projects yet. Start one to document your journey!
              </p>
              <Link
                href="/projects/new"
                className="inline-block px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow text-sm"
              >
                Start a Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayMyProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[hsl(var(--surface-container-lowest))] rounded-lg border border-[hsl(var(--outline-variant))] overflow-hidden flex flex-col"
                >
                  {project.cover_photo_url ? (
                    <img
                      src={project.cover_photo_url}
                      alt={project.title}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="h-32 w-full bg-[hsl(var(--surface-container))] flex items-center justify-center text-4xl">
                      🌿
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                        {project.title}
                      </h3>
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-[hsl(var(--on-surface-variant))] line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-auto flex gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 text-center text-xs px-3 py-2 rounded-full border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))] transition-colors font-medium"
                      >
                        View
                      </Link>
                      <Link
                        href={`/projects/${project.id}#add-update`}
                        className="flex-1 text-center text-xs px-3 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-md transition-shadow"
                      >
                        Add Update
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Tanks */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Tanks</h2>
            <Link href="/explore" className="text-sm text-[hsl(var(--primary))] hover:underline">
              View all →
            </Link>
          </div>

          {feedLoading ? (
            <div className="text-center py-6 text-[hsl(var(--on-surface-variant))]">Loading...</div>
          ) : recentTanks.length === 0 ? (
            <div className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-12 text-center border border-[hsl(var(--outline-variant))]">
              <div className="text-5xl mb-4">🐟</div>
              <h3 className="text-xl font-semibold mb-2">No Tanks Yet</h3>
              <p className="text-[hsl(var(--on-surface-variant))] mb-6">
                Be the first to add a tank to the community!
              </p>
              <Link
                href="/tanks/new"
                className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
              >
                Add Your Tank
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTanks.map((tank) => {
                const primaryPhoto =
                  tank.photos?.find((p) => p.is_primary) || tank.photos?.[0];
                return (
                  <Link
                    key={tank.id}
                    href={`/tanks/${tank.id}`}
                    className="bg-[hsl(var(--surface-container-lowest))] rounded-lg overflow-hidden border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors group"
                  >
                    <div className="h-48 relative bg-gradient-to-br from-[hsl(var(--primary-container))] to-[hsl(var(--secondary-container))]">
                      {primaryPhoto ? (
                        <Image
                          src={primaryPhoto.url}
                          alt={tank.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl">🐠</div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{tank.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))]">
                          {tank.tank_type.charAt(0).toUpperCase() + tank.tank_type.slice(1)}
                        </span>
                        <span className="text-sm text-[hsl(var(--on-surface-variant))]">
                          💧 {(tank.volume_liters / 3.78541).toFixed(1)} gal
                        </span>
                      </div>
                      {tank.description && (
                        <p className="text-sm text-[hsl(var(--on-surface-variant))] line-clamp-2 mb-3">
                          {tank.description}
                        </p>
                      )}
                      <div className="text-xs text-[hsl(var(--on-surface-variant))]">
                        Added {new Date(tank.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-[hsl(var(--primary))] hover:underline">
              View all →
            </Link>
          </div>

          {feedLoading ? (
            <div className="text-center py-6 text-[hsl(var(--on-surface-variant))]">Loading...</div>
          ) : recentProjects.length === 0 ? (
            <div className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-12 text-center border border-[hsl(var(--outline-variant))]">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-[hsl(var(--on-surface-variant))] mb-6">
                Start documenting your aquarium journey!
              </p>
              <Link
                href="/projects/new"
                className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
              >
                Create a Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-[hsl(var(--surface-container-lowest))] rounded-lg overflow-hidden border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors group"
                >
                  {project.cover_photo_url ? (
                    <div className="h-48 relative">
                      <Image
                        src={project.cover_photo_url}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-[hsl(var(--secondary-container))] to-[hsl(var(--tertiary-container))] flex items-center justify-center">
                      <div className="text-6xl">📝</div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{project.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))]">
                        {project.project_type.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[project.status]}`}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-[hsl(var(--on-surface-variant))] line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                    <div className="text-xs text-[hsl(var(--on-surface-variant))]">
                      Started {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
}
