'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.display_name || user.username}!</h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Discover tanks, connect with hobbyists, and share your aquarium journey.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/tanks/new"
            className="p-6 bg-[hsl(var(--surface-container-lowest))] rounded-lg border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            <div className="text-3xl mb-2">🐠</div>
            <h3 className="font-semibold mb-1">Add a Tank</h3>
            <p className="text-sm text-[hsl(var(--on-surface-variant))]">
              Showcase your aquarium setup
            </p>
          </Link>

          <Link
            href="/marketplace/new"
            className="p-6 bg-[hsl(var(--surface-container-lowest))] rounded-lg border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            <div className="text-3xl mb-2">🏪</div>
            <h3 className="font-semibold mb-1">Create Listing</h3>
            <p className="text-sm text-[hsl(var(--on-surface-variant))]">
              Sell or trade equipment
            </p>
          </Link>

          <Link
            href="/profile"
            className="p-6 bg-[hsl(var(--surface-container-lowest))] rounded-lg border border-[hsl(var(--outline-variant))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-semibold mb-1">Your Profile</h3>
            <p className="text-sm text-[hsl(var(--on-surface-variant))]">
              Manage your account
            </p>
          </Link>
        </div>

        {/* Feed placeholder */}
        <div className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-8 text-center border border-[hsl(var(--outline-variant))]">
          <div className="text-5xl mb-4">🐟</div>
          <h2 className="text-xl font-semibold mb-2">Your Feed is Empty</h2>
          <p className="text-[hsl(var(--on-surface-variant))] mb-6">
            Start following other hobbyists or add your first tank to see content here
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/explore"
              className="inline-block px-6 py-3 rounded-full font-semibold border border-[hsl(var(--outline))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container))] transition-colors"
            >
              Explore Tanks
            </Link>
            <Link
              href="/tanks/new"
              className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
            >
              Add Your First Tank
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
