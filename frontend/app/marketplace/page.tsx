'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import type { Listing, ListingCategory, ListingPriceType } from '@/lib/types';

const categories: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'fish', label: 'Fish' },
  { value: 'plants', label: 'Plants' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'full_setup', label: 'Full Setups' },
  { value: 'other', label: 'Other' },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [priceType, setPriceType] = useState<ListingPriceType | 'all'>('all');

  useEffect(() => {
    loadListings();
  }, [selectedCategory, priceType]);

  const loadListings = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (priceType !== 'all') params.price_type = priceType;

      const response = await api.get('/api/v1/marketplace', { params });
      setListings(response.data.listings || []);
    } catch (err: any) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  const formatPrice = (listing: Listing) => {
    if (listing.price_type === 'free') return 'FREE';
    if (listing.price_type === 'negotiable') return listing.price ? `$${listing.price.toFixed(2)} (OBO)` : 'Make Offer';
    return listing.price ? `$${listing.price.toFixed(2)}` : 'N/A';
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
              <p className="text-text-secondary">Buy and sell fish, plants, equipment, and more</p>
            </div>
            {user && (
              <Link
                href="/marketplace/new"
                className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-shadow"
              >
                + Create Listing
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ListingCategory | 'all')}
                className="px-4 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-secondary block mb-1">Price Type</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as ListingPriceType | 'all')}
                className="px-4 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="fixed">Fixed Price</option>
                <option value="free">Free/Giveaway</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-text-secondary">Loading listings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && (
          <div className="bg-surface rounded-lg p-12 text-center border border-border">
            <div className="text-5xl mb-4">🐠</div>
            <h2 className="text-xl font-semibold mb-2">No Listings Found</h2>
            <p className="text-text-secondary mb-6">
              Be the first to list something!
            </p>
            {user && (
              <Link
                href="/marketplace/new"
                className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-shadow"
              >
                Create Listing
              </Link>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => {
              const primaryPhoto = listing.photos?.find(p => p.is_primary) || listing.photos?.[0];
              
              return (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="bg-surface rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
                >
                  {/* Listing Image */}
                  <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-secondary/10">
                    {primaryPhoto ? (
                      <Image
                        src={primaryPhoto.photo_url}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">🐠</div>
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/90 text-gray-800">
                        {getCategoryLabel(listing.category)}
                      </span>
                    </div>
                    {/* Price Badge */}
                    <div className="absolute bottom-3 right-3">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                        listing.price_type === 'free' ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-800'
                      }`}>
                        {formatPrice(listing)}
                      </span>
                    </div>
                  </div>

                  {/* Listing Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {listing.title}
                    </h3>
                    {listing.description && (
                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {listing.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      {listing.location_city && (
                        <span>📍 {listing.location_city}, {listing.location_state}</span>
                      )}
                    </div>
                    {listing.user && (
                      <div className="mt-2 text-xs text-text-secondary">
                        By {listing.user.display_name || listing.user.username}
                      </div>
                    )}
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
