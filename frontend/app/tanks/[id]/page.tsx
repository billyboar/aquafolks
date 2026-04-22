'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import LikeButton from '@/components/LikeButton';
import CommentSection from '@/components/CommentSection';
import PhotoViewer from '@/components/PhotoViewer';
import ReportButton from '@/components/ReportButton';
import type { Tank } from '@/lib/types';

export default function TankDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;
  
  const [tank, setTank] = useState<Tank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [livestock, setLivestock] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerInitialIndex, setPhotoViewerInitialIndex] = useState(0);

  useEffect(() => {
    if (tankId) {
      loadTank();
    }
  }, [tankId]);

  const loadTank = async () => {
    try {
      const response = await api.get(`/api/v1/tanks/${tankId}`);
      setTank(response.data.tank);
      
      // Load livestock
      const livestockResponse = await api.get(`/api/v1/tanks/${tankId}/livestock`);
      setLivestock(livestockResponse.data.livestock || []);

      // Load photos
      const photosResponse = await api.get(`/api/v1/tanks/${tankId}/photos`);
      setPhotos(photosResponse.data || []);
    } catch (err: any) {
      setError('Failed to load tank details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tank? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/v1/tanks/${tankId}`);
      router.push('/tanks');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete tank');
    }
  };

  const formatVolume = (liters: number) => {
    const gallons = liters / 3.78541;
    return { gallons: gallons.toFixed(1), liters: liters.toFixed(1) };
  };

  const formatDimension = (cm: number) => {
    const inches = cm / 2.54;
    return { inches: inches.toFixed(1), cm: cm.toFixed(1) };
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

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[hsl(var(--on-surface-variant))]">Loading tank...</p>
        </div>
      </>
    );
  }

  if (error || !tank) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm mb-6">
            {error || 'Tank not found'}
          </div>
          <Link
            href="/tanks"
            className="text-[hsl(var(--primary))] hover:underline"
          >
            ← Back to My Tanks
          </Link>
        </div>
      </>
    );
  }

  const isOwner = user?.id === tank.user_id;
  const volume = formatVolume(tank.volume_liters);

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/tanks"
            className="text-sm text-[hsl(var(--primary))] hover:underline mb-4 inline-block"
          >
            ← Back to My Tanks
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{tank.name}</h1>
              <div className="flex items-center gap-3 text-sm text-[hsl(var(--on-surface-variant))]">
                <span className="px-3 py-1 rounded-full bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))]">
                  {getTankTypeLabel(tank.tank_type)}
                </span>
                <span>💧 {volume.gallons} gal ({volume.liters}L)</span>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              {!isOwner && (
                <ReportButton
                  reportableType="tank"
                  reportableId={tankId}
                  reportedUserId={tank.user_id}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-red-600"
                />
              )}
              {isOwner && (
                <Link
                  href={`/tanks/${tankId}/edit`}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                >
                  Edit Tank
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Likes Section */}
        <div className="mb-8">
          <LikeButton likeableType="tank" likeableId={tankId} />
        </div>

        {/* Cover Photo / Gallery */}
        <div className="mb-8">
          {photos.length > 0 ? (
            <div className="space-y-4">
              {/* Primary photo */}
              <div
                className="h-96 relative rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => {
                  const photoList = photos.map(p => ({ url: p.url, caption: p.caption }));
                  setPhotoViewerInitialIndex(0);
                  setPhotoViewerOpen(true);
                }}
              >
                <Image
                  src={photos[0].url}
                  alt={photos[0].caption || tank.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
                {photos[0].caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-sm">{photos[0].caption}</p>
                  </div>
                )}
              </div>

              {/* Photo thumbnails */}
              {photos.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {photos.slice(1).map((photo: any, index: number) => (
                    <div
                      key={photo.id}
                      className="aspect-square relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setPhotoViewerInitialIndex(index + 1);
                        setPhotoViewerOpen(true);
                      }}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || `Photo ${index + 2}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 bg-gradient-to-br from-[hsl(var(--primary-container))] to-[hsl(var(--secondary-container))] rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">🐠</div>
                <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                  No photos yet
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tank Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {tank.description && (
              <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">About This Tank</h2>
                <p className="text-[hsl(var(--on-surface-variant))] whitespace-pre-wrap">
                  {tank.description}
                </p>
              </section>
            )}

            <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Livestock</h2>
              {livestock.length === 0 ? (
                <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                  No livestock added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {livestock.map((fish: any) => (
                    <div
                      key={fish.id}
                      className="p-3 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--outline-variant))]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{fish.common_name}</div>
                          <div className="text-sm text-[hsl(var(--on-surface-variant))] italic">
                            {fish.scientific_name}
                          </div>
                          {fish.fish_species && (
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))]">
                                {fish.fish_species.type}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]">
                                {fish.fish_species.care_level}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))]">
                                {fish.fish_species.temperament}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium">Qty: {fish.quantity}</div>
                          {fish.fish_species && (
                            <div className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">
                              Max: {fish.fish_species.max_size_cm}cm
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Equipment</h2>
              <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                Equipment list coming soon
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Specifications</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[hsl(var(--on-surface-variant))] mb-1">Volume</div>
                  <div className="font-medium">{volume.gallons} gallons ({volume.liters} liters)</div>
                </div>

                {tank.dimensions_length > 0 && tank.dimensions_width > 0 && tank.dimensions_height > 0 && (
                  <div>
                    <div className="text-[hsl(var(--on-surface-variant))] mb-1">Dimensions</div>
                    <div className="font-medium">
                      {formatDimension(tank.dimensions_length).inches}" × {formatDimension(tank.dimensions_width).inches}" × {formatDimension(tank.dimensions_height).inches}"
                    </div>
                    <div className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">
                      ({formatDimension(tank.dimensions_length).cm} × {formatDimension(tank.dimensions_width).cm} × {formatDimension(tank.dimensions_height).cm} cm)
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[hsl(var(--on-surface-variant))] mb-1">Tank Type</div>
                  <div className="font-medium">{getTankTypeLabel(tank.tank_type)}</div>
                </div>

                <div>
                  <div className="text-[hsl(var(--on-surface-variant))] mb-1">Created</div>
                  <div className="font-medium">
                    {new Date(tank.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </section>

            {isOwner && (
              <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Actions</h2>
                <div className="space-y-2">
                  <Link
                    href={`/tanks/${tankId}/edit`}
                    className="block w-full px-4 py-2 text-center rounded-lg border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                  >
                    Edit Tank
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="block w-full px-4 py-2 text-center rounded-lg border border-[hsl(var(--error))] text-[hsl(var(--error))] hover:bg-[hsl(var(--error-container))] transition-colors"
                  >
                    Delete Tank
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="max-w-3xl">
          <CommentSection commentableType="tank" commentableId={tankId} />
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {photoViewerOpen && photos.length > 0 && (
        <PhotoViewer
          photos={photos.map(p => ({ url: p.url, caption: p.caption }))}
          initialIndex={photoViewerInitialIndex}
          onClose={() => setPhotoViewerOpen(false)}
        />
      )}
    </>
  );
}
