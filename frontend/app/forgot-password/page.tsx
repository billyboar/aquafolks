'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
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
            <h2 className="text-3xl font-bold tracking-tight">Reset your password</h2>
            <p className="mt-2 text-sm text-[hsl(var(--on-surface-variant))]">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))] px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">Check your email!</p>
                <p>If an account exists with that email, we've sent you a password reset link.</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface-container-lowest))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">
                  Back to login
                </Link>
              </p>
              <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-[hsl(var(--primary))] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
