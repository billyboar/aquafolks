'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/lib/api/notifications';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [mounted, setMounted] = useState(false);

  const [localPreferences, setLocalPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    notify_on_comment: true,
    notify_on_like: true,
    notify_on_follow: true,
    notify_on_message: true,
    notify_on_project_update: true,
    notify_on_marketplace: true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
        notify_on_comment: preferences.notify_on_comment,
        notify_on_like: preferences.notify_on_like,
        notify_on_follow: preferences.notify_on_follow,
        notify_on_message: preferences.notify_on_message,
        notify_on_project_update: preferences.notify_on_project_update,
        notify_on_marketplace: preferences.notify_on_marketplace,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof typeof localPreferences) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync(localPreferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[hsl(var(--surface-container))] rounded w-1/4" />
            <div className="h-64 bg-[hsl(var(--surface-container))] rounded" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--on-surface))] mb-2">Settings</h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Manage your notification preferences
          </p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            Settings saved successfully!
          </div>
        )}

        {/* Notification Preferences */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--outline-variant))] rounded-lg overflow-hidden">
          {/* General Notification Settings */}
          <div className="p-6 border-b border-[hsl(var(--outline-variant))]">
            <h2 className="text-lg font-semibold mb-4">General Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[hsl(var(--on-surface))]">Email Notifications</h3>
                  <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('email_notifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.email_notifications
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[hsl(var(--on-surface))]">Push Notifications</h3>
                  <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                    Receive push notifications in your browser
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('push_notifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.push_notifications
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.push_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Notification Types</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[hsl(var(--on-surface))]">Comments</h3>
                    <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                      When someone comments on your content
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notify_on_comment')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.notify_on_comment
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.notify_on_comment ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[hsl(var(--on-surface))]">Likes</h3>
                    <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                      When someone likes your content
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notify_on_like')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.notify_on_like
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.notify_on_like ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[hsl(var(--on-surface))]">Followers</h3>
                    <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                      When someone follows you
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notify_on_follow')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.notify_on_follow
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.notify_on_follow ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[hsl(var(--on-surface))]">Messages</h3>
                    <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                      When you receive a new message
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notify_on_message')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.notify_on_message
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.notify_on_message ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[hsl(var(--on-surface))]">Project Updates</h3>
                    <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                      Updates from projects you're subscribed to
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notify_on_project_update')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.notify_on_project_update
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.notify_on_project_update ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[hsl(var(--on-surface))]">Marketplace</h3>
                    <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                      Activity on your marketplace listings
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notify_on_marketplace')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences.notify_on_marketplace
                      ? 'bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--outline))]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.notify_on_marketplace ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={updatePreferences.isPending}
            className="px-6 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--on-primary))] rounded-lg font-medium hover:bg-[hsl(var(--primary)/0.9)] transition-colors disabled:opacity-50"
          >
            {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-[hsl(var(--outline))] rounded-lg font-medium hover:bg-[hsl(var(--surface-container))] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </>
  );
}
