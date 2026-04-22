'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { resetPassword } from '@/lib/api/auth';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
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
            <h2 className="text-3xl font-bold tracking-tight">Set new password</h2>
            <p className="mt-2 text-sm text-[hsl(var(--on-surface-variant))]">
              Enter your new password below
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
                <p className="font-semibold mb-1">Password reset successful!</p>
                <p>Redirecting to login page...</p>
              </div>
            )}

            {!success && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface-container-lowest))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                    placeholder="Enter new password (min 8 characters)"
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface-container-lowest))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                    placeholder="Confirm new password"
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </>
            )}

            <p className="text-center text-sm text-[hsl(var(--on-surface-variant))]">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
