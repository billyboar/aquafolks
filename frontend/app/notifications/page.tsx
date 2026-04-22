'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/lib/api/notifications';
import { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, error } = useNotifications(page, 20);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMarkAsRead = (notificationId: number) => {
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (notificationId: number) => {
    deleteNotification.mutate(notificationId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'like':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        );
      case 'follow':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'project_update':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'marketplace':
        return (
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[hsl(var(--surface-container))] rounded w-1/4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[hsl(var(--surface-container))] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] p-4 rounded-lg">
          Error loading notifications. Please try again.
        </div>
      </div>
    );
  }

  const unreadCount = data?.notifications.filter(n => !n.is_read).length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--on-surface))]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[hsl(var(--on-surface-variant))] mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="px-4 py-2 text-sm font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-container))] rounded-lg transition-colors disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--outline-variant))] rounded-lg overflow-hidden">
        {data && data.notifications.length > 0 ? (
          <div className="divide-y divide-[hsl(var(--outline-variant))]">
            {data.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-[hsl(var(--surface-container))] transition-colors ${
                  !notification.is_read ? 'bg-[hsl(var(--primary-container)/0.1)]' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  {getNotificationIcon(notification.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {notification.action_url ? (
                      <Link
                        href={notification.action_url}
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        className="block group"
                      >
                        <p className="text-[hsl(var(--on-surface))] group-hover:text-[hsl(var(--primary))]">
                          {notification.message}
                        </p>
                        <p className="text-sm text-[hsl(var(--on-surface-variant))] mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-[hsl(var(--on-surface))]">{notification.message}</p>
                        <p className="text-sm text-[hsl(var(--on-surface-variant))] mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsRead.isPending}
                        className="p-2 text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))] rounded-lg transition-colors disabled:opacity-50"
                        title="Mark as read"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      disabled={deleteNotification.isPending}
                      className="p-2 text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--surface-container))] rounded-lg transition-colors disabled:opacity-50"
                      title="Delete notification"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-[hsl(var(--on-surface-variant))] opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-[hsl(var(--on-surface-variant))] mt-4">No notifications yet</p>
            <p className="text-sm text-[hsl(var(--on-surface-variant))] mt-2">
              When you get notifications, they'll show up here
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-[hsl(var(--on-surface))] bg-[hsl(var(--surface-container))] rounded-lg hover:bg-[hsl(var(--surface-container-high))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-[hsl(var(--on-surface-variant))]">
            Page {page} of {Math.ceil(data.total / data.limit)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(data.total / data.limit)}
            className="px-4 py-2 text-sm font-medium text-[hsl(var(--on-surface))] bg-[hsl(var(--surface-container))] rounded-lg hover:bg-[hsl(var(--surface-container-high))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
