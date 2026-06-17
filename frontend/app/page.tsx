'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/feed');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[hsl(var(--on-surface-variant))]">Loading...</p>
        </div>
      </>
    );
  }

  // Landing page for guests
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
