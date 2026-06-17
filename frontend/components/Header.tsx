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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('access_token'));
    }
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [pathname]);

  const { data: unreadMessagesCount } = useQuery<{ unread_count: number }>({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    },
    enabled: !!token && !!user,
    refetchInterval: 10000,
  });

  const { data: notificationsData } = useNotifications(1, 5);
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) markAsRead.mutate(Number(notification.id));
    setShowNotifications(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
      case 'like':
        return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
      case 'follow':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      case 'message':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case 'project_update':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'marketplace':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      default:
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `px-2 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
      isActive(path)
        ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
        : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `flex items-center px-4 py-3 text-base font-medium transition-colors ${
      isActive(path)
        ? 'text-[hsl(var(--primary))] bg-[hsl(var(--surface-container-highest))]'
        : 'text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))]'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--surface))] border-b border-[hsl(var(--outline-variant))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 shrink-0">
            <Image src="/logo.png" alt="AquaFolks" width={40} height={40} className="rounded-lg" unoptimized />
            <span className="hidden lg:block text-2xl font-bold">
              Aqua<span className="text-[hsl(var(--primary))]">Folks</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/explore" className={navLinkClass('/explore')}>Explore</Link>
            <Link href="/projects" className={navLinkClass('/projects')}>Projects</Link>
            {user && (
              <>
                <Link href="/feed" className={navLinkClass('/feed')}>Feed</Link>
                <Link href="/tanks" className={navLinkClass('/tanks')}>My Tanks</Link>
                <Link href={`/users/${user.id}`} className={navLinkClass(`/users/${user.id}`)}>My Projects</Link>
                <Link href="/marketplace" className={navLinkClass('/marketplace')}>Marketplace</Link>
                <Link href="/messages" className={`relative ${navLinkClass('/messages')}`}>
                  Messages
                  {unreadMessagesCount && unreadMessagesCount.unread_count > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-[hsl(var(--error))] text-white text-[10px] font-bold leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center pointer-events-none">
                      {unreadMessagesCount.unread_count > 99 ? '99+' : unreadMessagesCount.unread_count}
                    </span>
                  )}
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-1 shrink-0">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative flex items-center">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); setShowMobileMenu(false); }}
                    className="relative p-2 text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))] rounded-md transition-colors flex items-center"
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount != null && unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-[hsl(var(--error))] text-white text-[10px] font-bold leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center pointer-events-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <div className="fixed top-16 right-2 left-2 sm:left-auto sm:right-4 sm:w-96 z-50
                        bg-[hsl(var(--surface))] border border-[hsl(var(--outline-variant))] rounded-lg shadow-lg
                        max-h-[calc(100vh-5rem)] overflow-y-auto">
                        <div className="sticky top-0 bg-[hsl(var(--surface))] border-b border-[hsl(var(--outline-variant))] px-4 py-3 flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Notifications</h3>
                          <Link href="/notifications" onClick={() => setShowNotifications(false)} className="text-xs text-[hsl(var(--primary))] hover:underline">
                            View All
                          </Link>
                        </div>
                        <div className="py-2">
                          {notificationsData && notificationsData.notifications.length > 0 ? (
                            notificationsData.notifications.map((notification: Notification) => (
                              <Link
                                key={notification.id}
                                href={notification.link || '/notifications'}
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
                                    <p className="text-sm text-[hsl(var(--on-surface))]">{notification.message}</p>
                                    <p className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">{formatTimeAgo(notification.created_at)}</p>
                                  </div>
                                  {!notification.is_read && (
                                    <div className="flex-shrink-0 mt-1">
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

                {/* User Menu — desktop only */}
                <div className="relative hidden md:block">
                  <button
                    aria-label="User menu"
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary-container))] flex items-center justify-center text-[hsl(var(--on-primary-container))] font-semibold text-sm">
                      {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:block">{user.display_name || user.username}</span>
                    <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-[hsl(var(--surface))] border border-[hsl(var(--outline-variant))] rounded-lg shadow-lg z-20 py-2">
                        <Link href={`/users/${user.id}`} onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-[hsl(var(--surface-container))] transition-colors">View Profile</Link>
                        <Link href="/settings" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-[hsl(var(--surface-container))] transition-colors">Settings</Link>
                        <div className="border-t border-[hsl(var(--outline-variant))] my-2" />
                        <button onClick={() => { setShowUserMenu(false); logout(); }} className="block w-full text-left px-4 py-2 text-sm text-[hsl(var(--error))] hover:bg-[hsl(var(--surface-container))] transition-colors">
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Hamburger — mobile only */}
                <button
                  onClick={() => { setShowMobileMenu(!showMobileMenu); setShowNotifications(false); }}
                  className="md:hidden p-2 rounded-md text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                  aria-label="Toggle menu"
                >
                  {showMobileMenu ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium px-3 py-2 rounded-md text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container))] transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && user && (
        <>
          <div className="fixed inset-0 z-30 top-16" onClick={() => setShowMobileMenu(false)} />
          <div className="md:hidden absolute left-0 right-0 z-40 bg-[hsl(var(--surface))] border-b border-[hsl(var(--outline-variant))] shadow-lg">
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[hsl(var(--outline-variant))]">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary-container))] flex items-center justify-center text-[hsl(var(--on-primary-container))] font-semibold">
                {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm">{user.display_name || user.username}</p>
                <p className="text-xs text-[hsl(var(--on-surface-variant))]">{user.email}</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="py-2">
              <Link href="/explore" className={mobileNavLinkClass('/explore')} onClick={() => setShowMobileMenu(false)}>Explore</Link>
              <Link href="/projects" className={mobileNavLinkClass('/projects')} onClick={() => setShowMobileMenu(false)}>Projects</Link>
              <Link href="/feed" className={mobileNavLinkClass('/feed')} onClick={() => setShowMobileMenu(false)}>Feed</Link>
              <Link href="/tanks" className={mobileNavLinkClass('/tanks')} onClick={() => setShowMobileMenu(false)}>My Tanks</Link>
              {user && <Link href={`/users/${user.id}`} className={mobileNavLinkClass(`/users/${user.id}`)} onClick={() => setShowMobileMenu(false)}>My Projects</Link>}
              <Link href="/marketplace" className={mobileNavLinkClass('/marketplace')} onClick={() => setShowMobileMenu(false)}>Marketplace</Link>
              <Link href="/messages" className={`relative ${mobileNavLinkClass('/messages')}`} onClick={() => setShowMobileMenu(false)}>
                Messages
                {unreadMessagesCount && unreadMessagesCount.unread_count > 0 && (
                  <span className="ml-2 bg-[hsl(var(--error))] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {unreadMessagesCount.unread_count > 99 ? '99+' : unreadMessagesCount.unread_count}
                  </span>
                )}
              </Link>
            </nav>

            {/* Account links */}
            <div className="border-t border-[hsl(var(--outline-variant))] py-2">
              <Link href={`/users/${user.id}`} className={mobileNavLinkClass(`/users/${user.id}`)} onClick={() => setShowMobileMenu(false)}>View Profile</Link>
              <Link href="/settings" className={mobileNavLinkClass('/settings')} onClick={() => setShowMobileMenu(false)}>Settings</Link>
              <button
                onClick={() => { setShowMobileMenu(false); logout(); }}
                className="flex items-center w-full px-4 py-3 text-base font-medium text-[hsl(var(--error))] hover:bg-[hsl(var(--surface-container))] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
