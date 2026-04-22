'use client';

import { useAuth } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import PhotoViewer from '@/components/PhotoViewer';
import ReportButton from '@/components/ReportButton';
import type { Listing } from '@/lib/types';

export default function ListingDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<{ url: string; caption?: string }[]>([]);
  const [photoViewerInitialIndex, setPhotoViewerInitialIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  const loadListing = async () => {
    try {
      const response = await api.get(`/api/v1/marketplace/${listingId}`);
      setListing(response.data.listing);
    } catch (err: any) {
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (photos: { url: string; caption?: string }[], index: number) => {
    setPhotoViewerPhotos(photos);
    setPhotoViewerInitialIndex(index);
    setPhotoViewerOpen(true);
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/api/v1/marketplace/${listingId}/favorite`);
      if (listing) {
        setListing({
          ...listing,
          is_favorited: response.data.is_favorited,
          favorite_count: response.data.is_favorited 
            ? listing.favorite_count + 1 
            : listing.favorite_count - 1,
        });
      }
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleContact = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setShowContactModal(true);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      fish: 'Fish',
      plants: 'Plants',
      equipment: 'Equipment',
      full_setup: 'Full Setup',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const formatPrice = (listing: Listing) => {
    if (listing.price_type === 'free') return 'FREE';
    if (listing.price_type === 'negotiable')
      return listing.price ? `$${listing.price.toFixed(2)} (OBO)` : 'Make Offer';
    return listing.price ? `$${listing.price.toFixed(2)}` : 'N/A';
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-text-secondary">Loading listing...</p>
        </div>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm mb-6">
            {error || 'Listing not found'}
          </div>
          <Link href="/marketplace" className="text-primary hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </>
    );
  }

  const isOwner = user?.id === listing.user_id;
  const primaryPhoto = listing.photos?.find((p) => p.is_primary) || listing.photos?.[0];

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/marketplace"
          className="text-sm text-primary hover:underline mb-4 inline-block"
        >
          ← Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Photos */}
          <div>
            {/* Main Photo */}
            {primaryPhoto ? (
              <div
                className="aspect-square relative rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity mb-4"
                onClick={() =>
                  handleImageClick(
                    listing.photos?.map((p) => ({ url: p.photo_url })) || [],
                    0
                  )
                }
              >
                <Image
                  src={primaryPhoto.photo_url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <div className="text-9xl">🐠</div>
              </div>
            )}

            {/* Thumbnail Strip */}
            {listing.photos && listing.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="aspect-square relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-border hover:border-primary"
                    onClick={() =>
                      handleImageClick(
                        listing.photos?.map((p) => ({ url: p.photo_url })) || [],
                        index
                      )
                    }
                  >
                    <Image
                      src={photo.photo_url}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div>
            <div className="bg-surface rounded-lg p-6 border border-border">
              {/* Title & Category */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-3">
                  {getCategoryLabel(listing.category)}
                </span>
                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                {listing.condition && (
                  <p className="text-sm text-text-secondary">
                    Condition: <span className="font-medium">{listing.condition}</span>
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="text-4xl font-bold text-primary">{formatPrice(listing)}</div>
                {listing.price_type === 'negotiable' && (
                  <p className="text-sm text-text-secondary mt-1">Price is negotiable</p>
                )}
              </div>

              {/* Location */}
              {listing.location_city && (
                <div className="mb-6 flex items-center gap-2 text-text-secondary">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
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
                    {listing.location_city}, {listing.location_state}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                {!isOwner && listing.status === 'available' && (
                  <button
                    onClick={handleContact}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-shadow"
                  >
                    Contact Seller
                  </button>
                )}

                {isOwner && (
                  <Link
                    href={`/marketplace/${listingId}/edit`}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold text-center border border-border hover:bg-surface-hover transition-colors"
                  >
                    Edit Listing
                  </Link>
                )}

                {user && (
                  <button
                    onClick={handleFavorite}
                    className="px-6 py-3 rounded-lg border border-border hover:bg-surface-hover transition-colors"
                  >
                    {listing.is_favorited ? '❤️' : '🤍'}
                  </button>
                )}
              </div>

              {/* Report Button */}
              {!isOwner && user && (
                <div className="mb-6">
                  <ReportButton
                    reportableType="listing"
                    reportableId={listingId}
                    reportedUserId={listing.user_id}
                    className="text-sm text-gray-500 hover:text-red-600"
                  />
                </div>
              )}

              {/* Status Badge */}
              {listing.status !== 'available' && (
                <div className="mb-6">
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                      listing.status === 'sold'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {listing.status === 'sold' ? 'SOLD' : 'RESERVED'}
                  </span>
                </div>
              )}

              {/* Seller Info */}
              {listing.user && (
                <div className="pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold mb-3">Seller</h3>
                  <Link
                    href={`/users/${listing.user.id}`}
                    className="flex items-center gap-3 hover:bg-surface-hover p-2 rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {listing.user.display_name?.[0]?.toUpperCase() ||
                        listing.user.username?.[0]?.toUpperCase() ||
                        'U'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {listing.user.display_name || listing.user.username}
                      </div>
                      <div className="text-sm text-text-secondary">
                        @{listing.user.username}
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Stats */}
              <div className="pt-6 border-t border-border mt-6">
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span>👁️ {listing.view_count} views</span>
                  <span>❤️ {listing.favorite_count} favorites</span>
                </div>
                <div className="text-xs text-text-secondary mt-2">
                  Listed {new Date(listing.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-surface rounded-lg p-6 border border-border mb-8">
          <h2 className="text-xl font-bold mb-4">Description</h2>
          <p className="text-text whitespace-pre-wrap">{listing.description}</p>
        </div>
      </div>

      {/* Photo Viewer */}
      {photoViewerOpen && (
        <PhotoViewer
          photos={photoViewerPhotos}
          initialIndex={photoViewerInitialIndex}
          onClose={() => setPhotoViewerOpen(false)}
        />
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="bg-surface rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Contact Seller</h2>
            <p className="text-text-secondary mb-6">
              Send a direct message to the seller to inquire about this listing.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-text">
                <strong>Seller:</strong> {listing.user?.display_name || listing.user?.username}
              </p>
              {listing.location_city && (
                <p className="text-sm text-text mt-1">
                  <strong>Location:</strong> {listing.location_city}, {listing.location_state}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-surface-hover transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (listing.user?.id) {
                    router.push(`/messages/${listing.user.id}`);
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-primary to-primary-hover"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
