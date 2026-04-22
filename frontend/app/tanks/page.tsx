'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import type { Tank } from '@/lib/types';

export default function MyTanksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadTanks();
    }
  }, [user, authLoading, router]);

  const loadTanks = async () => {
    try {
      const response = await api.get(`/api/v1/tanks/user/${user?.id}`);
      const tanksData = response.data.tanks || [];
      
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
    } catch (err: any) {
      setError('Failed to load your tanks');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[hsl(var(--on-surface-variant))]">Loading...</p>
        </div>
      </>
    );
  }

  const formatVolume = (liters: number) => {
    const gallons = liters / 3.78541;
    return `${gallons.toFixed(0)} gal (${liters.toFixed(0)}L)`;
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

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Tanks</h1>
            <p className="text-[hsl(var(--on-surface-variant))]">
              Manage your aquarium collection
            </p>
          </div>
          <Link
            href="/tanks/new"
            className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
          >
            + Add Tank
          </Link>
        </div>

        {error && (
          <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-[hsl(var(--on-surface-variant))]">Loading your tanks...</p>
          </div>
        ) : tanks.length === 0 ? (
          <div className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-12 text-center border border-[hsl(var(--outline-variant))]">
            <div className="text-5xl mb-4">🐠</div>
            <h2 className="text-xl font-semibold mb-2">No Tanks Yet</h2>
            <p className="text-[hsl(var(--on-surface-variant))] mb-6">
              Start showcasing your aquariums by adding your first tank
            </p>
            <Link
              href="/tanks/new"
              className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
            >
              Add Your First Tank
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tanks.map((tank) => {
              const primaryPhoto = tank.photos?.find((p) => p.is_primary) || tank.photos?.[0];
              
              return (
                <Link
                  key={tank.id}
                  href={`/tanks/${tank.id}`}
                  className="bg-[hsl(var(--surface-container-lowest))] rounded-lg overflow-hidden border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors group"
                >
                  {/* Cover Photo */}
                  <div className="h-48 relative bg-gradient-to-br from-[hsl(var(--primary-container))] to-[hsl(var(--secondary-container))]">
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
                        <div className="text-6xl">🐠</div>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-1">
                        {tank.name}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface-variant))] whitespace-nowrap ml-2">
                        {getTankTypeLabel(tank.tank_type)}
                      </span>
                    </div>

                    {tank.description && (
                      <p className="text-sm text-[hsl(var(--on-surface-variant))] mb-3 line-clamp-2">
                        {tank.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-[hsl(var(--on-surface-variant))]">
                      <div className="flex items-center gap-1">
                        <span>💧</span>
                        <span>{formatVolume(tank.volume_liters)}</span>
                      </div>
                      {tank.dimensions_length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>📏</span>
                          <span>
                            {(tank.dimensions_length / 2.54).toFixed(0)}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
