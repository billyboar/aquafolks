'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import type { Tank, Project } from '@/lib/types';

export default function Home() {
  const { user } = useAuth();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async () => {
    try {
      // Load recent tanks
      const tanksResponse = await api.get('/api/v1/tanks', {
        params: { limit: 6 }
      });
      const tanksData = tanksResponse.data.tanks || [];
      
      // Load photos for each tank
      const tanksWithPhotos = await Promise.all(
        tanksData.map(async (tank: Tank) => {
          try {
            const photosResponse = await api.get(`/api/v1/tanks/${tank.id}/photos`);
            return { ...tank, photos: photosResponse.data || [] };
          } catch {
            return tank;
          }
        })
      );
      
      setTanks(tanksWithPhotos);

      // Load recent projects
      const projectsResponse = await api.get('/api/v1/projects', {
        params: { limit: 6 }
      });
      setProjects(projectsResponse.data.projects || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (liters: number) => {
    const gallons = liters / 3.78541;
    return `${gallons.toFixed(1)} gal`;
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]',
      in_progress: 'bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))]',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.planning;
  };

  // Show landing page for non-logged-in users
  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <main className="max-w-4xl w-full space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <h1 className="text-6xl font-bold tracking-tight">
                Aqua<span className="text-[hsl(var(--primary))]">Folks</span>
              </h1>
              <p className="text-xl text-[hsl(var(--on-surface-variant))] max-w-2xl mx-auto">
                A sanctuary for aquarium hobbyists to share their tanks, 
                connect with the community, and discover amazing aquatic life.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[hsl(var(--surface-container-lowest))] rounded-[var(--radius-lg)] p-8 space-y-4 shadow-[0_20px_40px_hsla(var(--on-surface)/0.06)]">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] flex items-center justify-center text-white text-2xl">
                  🐠
                </div>
                <h3 className="text-xl font-semibold">Tank Showcase</h3>
                <p className="text-[hsl(var(--on-surface-variant))]">
                  Share your aquarium setup, livestock, and aquascaping journey with the community.
                </p>
              </div>

              <div className="bg-[hsl(var(--surface-container-lowest))] rounded-[var(--radius-lg)] p-8 space-y-4 shadow-[0_20px_40px_hsla(var(--on-surface)/0.06)]">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] flex items-center justify-center text-white text-2xl">
                  🏪
                </div>
                <h3 className="text-xl font-semibold">Marketplace</h3>
                <p className="text-[hsl(var(--on-surface-variant))]">
                  Buy, sell, or trade fish, plants, and equipment with hobbyists near you.
                </p>
              </div>

              <div className="bg-[hsl(var(--surface-container-lowest))] rounded-[var(--radius-lg)] p-8 space-y-4 shadow-[0_20px_40px_hsla(var(--on-surface)/0.06)]">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] flex items-center justify-center text-white text-2xl">
                  📝
                </div>
                <h3 className="text-xl font-semibold">Project Logs</h3>
                <p className="text-[hsl(var(--on-surface-variant))]">
                  Document your builds, breeding projects, and watch others' progress.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/register"
                className="inline-block px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
              >
                Get Started - Join AquaFolks
              </Link>
            </div>

            {/* Status */}
            <div className="text-center text-sm text-[hsl(var(--on-surface-variant))]">
              <p>🚀 Now in Beta - Join the Community!</p>
              <p className="mt-2">Built with Next.js, Go, and PostgreSQL</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Show feed for logged-in users
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.display_name || user.username}!</h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Here's what's happening in the AquaFolks community
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--on-surface-variant))]">Loading feed...</p>
          </div>
        ) : (
          <>
            {/* Recent Tanks Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Recent Tanks</h2>
                <Link
                  href="/explore"
                  className="text-sm text-[hsl(var(--primary))] hover:underline"
                >
                  View All →
                </Link>
              </div>

              {tanks.length === 0 ? (
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
                  {tanks.map((tank) => {
                    const primaryPhoto = tank.photos?.find((p) => p.is_primary) || tank.photos?.[0];
                    
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
                            <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <div className="text-6xl">🐠</div>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{tank.name}</h3>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))]">
                              {getTankTypeLabel(tank.tank_type)}
                            </span>
                            <span className="text-sm text-[hsl(var(--on-surface-variant))]">
                              💧 {formatVolume(tank.volume_liters)}
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

            {/* Recent Projects Section */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Recent Projects</h2>
                <Link
                  href="/projects"
                  className="text-sm text-[hsl(var(--primary))] hover:underline"
                >
                  View All →
                </Link>
              </div>

              {projects.length === 0 ? (
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
                  {projects.map((project) => (
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
                        <div className="h-48 bg-gradient-to-br from-[hsl(var(--secondary-container))] to-[hsl(var(--tertiary-container))] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <div className="text-6xl">📝</div>
                        </div>
                      )}

                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{project.title}</h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))]">
                            {getProjectTypeLabel(project.project_type)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-sm text-[hsl(var(--on-surface-variant))] line-clamp-2 mb-3">
                          {project.description}
                        </p>

                        <div className="text-xs text-[hsl(var(--on-surface-variant))]">
                          Started {new Date(project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
