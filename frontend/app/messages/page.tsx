'use client';

import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/lib/types';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const storedToken = localStorage.getItem('access_token');
      setToken(storedToken);
    }
  }, [user, authLoading, router]);

  const { data: conversations, isLoading, error } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/v1/messages/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired, dispatch event for global logout
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch conversations');
      }
      const data = await res.json();
      return data.conversations || [];
    },
    enabled: !!token,
    retry: 1, // Only retry once instead of 3 times
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/v1/messages/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        throw new Error('Failed to fetch unread count');
      }
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 10000, // Refetch every 10 seconds
    retry: 1,
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else if (hours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Show loading state while auth is being verified or token is being loaded
  if (!mounted || authLoading || (user && !token)) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                {unreadCount && unreadCount.count > 0 && (
                  <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                    {unreadCount.count} unread
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  Loading conversations...
                </div>
              ) : error ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-red-600 mb-2">Failed to load conversations</p>
                  <p className="text-gray-500 text-sm">Please try refreshing the page</p>
                </div>
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.other_user.id}
                    onClick={() => router.push(`/messages/${conversation.other_user.id}`)}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        {conversation.other_user.avatar_url ? (
                          <Image
                            src={conversation.other_user.avatar_url}
                            alt={conversation.other_user.username}
                            width={48}
                            height={48}
                            unoptimized
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {conversation.other_user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {conversation.unread_count}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h3
                            className={`text-sm font-semibold ${
                              conversation.unread_count > 0
                                ? 'text-gray-900'
                                : 'text-gray-700'
                            }`}
                          >
                            {conversation.other_user.username}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTimestamp(conversation.last_message_at)}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate ${
                            conversation.unread_count > 0
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          {conversation.last_message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start a conversation by contacting a seller on the marketplace
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
