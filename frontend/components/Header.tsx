'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/lib/api/notifications';
import { Notification } from '@/lib/types';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
    }
  }, [user]);

  const { data: unreadMessagesCount } = useQuery<{ count: number }>({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/v1/messages/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    },
    enabled: !!token && !!user,
    refetchInterval: 10000,
  });

  // Fetch notifications and unread count
  const { data: notificationsData } = useNotifications(1, 5);
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    setShowNotifications(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'like':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
      case 'follow':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'message':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'project_update':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'marketplace':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--surface))] border-b border-[hsl(var(--outline-variant))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="AquaFolks"
              width={48}
              height={48}
              className="rounded-lg"
              unoptimized
            />
            <span className="text-2xl font-bold">
              Aqua<span className="text-[hsl(var(--primary))]">Folks</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/explore"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/explore')
                  ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
                  : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
              }`}
            >
              Explore
            </Link>
            <Link
              href="/projects"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/projects')
                  ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
                  : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
              }`}
            >
              Projects
            </Link>
            {user && (
              <>
                <Link
                  href="/feed"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/feed')
                      ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
                      : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
                  }`}
                >
                  Feed
                </Link>
                <Link
                  href="/tanks"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/tanks')
                      ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
                      : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
                  }`}
                >
                  My Tanks
                </Link>
                <Link
                  href="/marketplace"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/marketplace')
                      ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
                      : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
                  }`}
                >
                  Marketplace
                </Link>
                <Link
                  href="/messages"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive('/messages')
                      ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
                      : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
                  }`}
                >
                  Messages
                  {unreadMessagesCount && unreadMessagesCount.count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[hsl(var(--error))] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessagesCount.count > 9 ? '9+' : unreadMessagesCount.count}
                    </span>
                  )}
                </Link>
              </>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))] rounded-full transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </button>
                  {unreadCount && unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[hsl(var(--error))] text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center pointer-events-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowNotifications(false)}
                      />
                      
                      {/* Notification Panel */}
                      <div className="absolute right-0 mt-2 w-80 bg-[hsl(var(--surface))] border border-[hsl(var(--outline-variant))] rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-[hsl(var(--surface))] border-b border-[hsl(var(--outline-variant))] px-4 py-3 flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Notifications</h3>
                          <Link
                            href="/notifications"
                            onClick={() => setShowNotifications(false)}
                            className="text-xs text-[hsl(var(--primary))] hover:underline"
                          >
                            View All
                          </Link>
                        </div>
                        <div className="py-2">
                          {notificationsData && notificationsData.notifications.length > 0 ? (
                            notificationsData.notifications.map((notification) => (
                              <Link
                                key={notification.id}
                                href={notification.action_url || '/notifications'}
                                onClick={() => handleNotificationClick(notification)}
                                className={`block px-4 py-3 hover:bg-[hsl(var(--surface-container))] transition-colors border-b border-[hsl(var(--outline-variant))] last:border-b-0 ${
                                  !notification.is_read ? 'bg-[hsl(var(--primary-container)/0.1)]' : ''
                                }`}
                              >
                                <div className="flex gap-3">
                                  <div className={`flex-shrink-0 mt-1 ${
                                    notification.type === 'like' ? 'text-red-500' :
                                    notification.type === 'follow' ? 'text-blue-500' :
                                    notification.type === 'comment' ? 'text-green-500' :
                                    notification.type === 'project_update' ? 'text-purple-500' :
                                    notification.type === 'marketplace' ? 'text-orange-500' :
                                    'text-[hsl(var(--on-surface-variant))]'
                                  }`}>
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[hsl(var(--on-surface))]">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">
                                      {formatTimeAgo(notification.created_at)}
                                    </p>
                                  </div>
                                  {!notification.is_read && (
                                    <div className="flex-shrink-0">
                                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                                    </div>
                                  )}
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center text-sm text-[hsl(var(--on-surface-variant))]">
                              No new notifications
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary-container))] flex items-center justify-center text-[hsl(var(--on-primary-container))] font-semibold">
                      {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span>{user.display_name || user.username}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 mt-2 w-48 bg-[hsl(var(--surface))] border border-[hsl(var(--outline-variant))] rounded-lg shadow-lg z-20 py-2">
                        <Link
                          href={`/users/${user.id}`}
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm hover:bg-[hsl(var(--surface-container))] transition-colors"
                        >
                          View Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm hover:bg-[hsl(var(--surface-container))] transition-colors"
                        >
                          Settings
                        </Link>
                        <div className="border-t border-[hsl(var(--outline-variant))] my-2" />
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-[hsl(var(--error))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
