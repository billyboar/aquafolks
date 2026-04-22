'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import type { Tank, TankType } from '@/lib/types';

const tankTypes: { value: TankType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Tanks' },
  { value: 'freshwater', label: 'Freshwater' },
  { value: 'planted', label: 'Planted' },
  { value: 'saltwater', label: 'Saltwater' },
  { value: 'reef', label: 'Reef' },
  { value: 'brackish', label: 'Brackish' },
];

export default function ExplorePage() {
  const { user } = useAuth();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<TankType | 'all'>('all');

  useEffect(() => {
    loadTanks();
  }, []);

  const loadTanks = async () => {
    try {
      const response = await api.get('/api/v1/tanks', {
        params: { limit: 50 }
      });
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
      setError('Failed to load tanks');
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

  const filteredTanks = selectedType === 'all' 
    ? tanks 
    : tanks.filter(tank => tank.tank_type === selectedType);

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Tanks</h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Discover amazing aquarium setups from the community
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {tankTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === type.value
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--on-surface-variant))]">Loading tanks...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTanks.length === 0 && (
          <div className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-12 text-center border border-[hsl(var(--outline-variant))]">
            <div className="text-5xl mb-4">🐟</div>
            <h2 className="text-xl font-semibold mb-2">No Tanks Found</h2>
            <p className="text-[hsl(var(--on-surface-variant))] mb-6">
              {selectedType === 'all' 
                ? 'Be the first to add a tank to the community!'
                : `No ${getTankTypeLabel(selectedType)} tanks found. Try a different filter.`
              }
            </p>
            {user && (
              <Link
                href="/tanks/new"
                className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
              >
                Add Your Tank
              </Link>
            )}
          </div>
        )}

        {/* Tank Grid */}
        {!loading && filteredTanks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTanks.map((tank) => {
              const primaryPhoto = tank.photos?.find((p) => p.is_primary) || tank.photos?.[0];
              
              return (
                <Link
                  key={tank.id}
                  href={`/tanks/${tank.id}`}
                  className="bg-[hsl(var(--surface-container-lowest))] rounded-lg overflow-hidden border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors group"
                >
                  {/* Tank Image */}
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

                  {/* Tank Info */}
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

        {/* Load More Placeholder */}
        {!loading && filteredTanks.length > 0 && (
          <div className="mt-8 text-center">
            <button
              className="px-6 py-3 rounded-full font-medium border border-[hsl(var(--outline))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container))] transition-colors"
              disabled
            >
              Load More (Coming Soon)
            </button>
          </div>
        )}
      </div>
    </>
  );
}
