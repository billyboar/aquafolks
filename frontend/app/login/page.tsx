'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email_or_username: emailOrUsername, password });
      router.push('/feed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-[hsl(var(--on-surface-variant))]">
              Sign in to your AquaFolks account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email-or-username" className="block text-sm font-medium mb-2">
                  Email or Username
                </label>
                <input
                  id="email-or-username"
                  name="email-or-username"
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface-container-lowest))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                  placeholder="Enter your email or username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface-container-lowest))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                  placeholder="Enter your password"
                />
                <div className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-sm text-[hsl(var(--primary))] hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-[hsl(var(--on-surface-variant))]">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-[hsl(var(--primary))] hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
