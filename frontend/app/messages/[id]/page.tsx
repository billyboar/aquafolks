'use client';

import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { Message, User } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useWebSocket } from '@/lib/useWebSocket';
import Header from '@/components/Header';

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const otherUserId = params.id as string;
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
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

      // Decode JWT to get current user ID
      if (storedToken) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          setCurrentUserId(payload.sub || payload.user_id);
        } catch (error) {
          console.error('Failed to decode token:', error);
          router.push('/login');
        }
      }
    }
  }, [user, authLoading, router]);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      const res = await fetch(
        `http://localhost:3000/api/v1/messages/conversations/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!token && !!otherUserId,
  });

  const { data: otherUser } = useQuery<User>({
    queryKey: ['user', otherUserId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/v1/users/${otherUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!token && !!otherUserId,
  });

  // WebSocket connection
  const { lastMessage, sendMessage, sendTypingIndicator, sendReadReceipt, isConnected } =
    useWebSocket(token || '');

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
        
        // Send read receipt if message is from the other user
        if (lastMessage.sender_id === otherUserId && lastMessage.message_id) {
          sendReadReceipt(lastMessage.message_id);
        }
      } else if (lastMessage.type === 'typing') {
        if (lastMessage.sender_id === otherUserId) {
          setIsTyping(lastMessage.is_typing || false);
        }
      } else if (lastMessage.type === 'read_receipt') {
        queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      }
    }
  }, [lastMessage, otherUserId, queryClient, sendReadReceipt]);

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      for (const id of messageIds) {
        await fetch(`http://localhost:3000/api/v1/messages/${id}/read`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    },
  });

  // Mark unread messages as read when viewing conversation
  useEffect(() => {
    if (messages && currentUserId) {
      const unreadMessages = messages
        .filter((msg) => msg.sender_id === otherUserId && !msg.is_read)
        .map((msg) => msg.id);
      
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate(unreadMessages);
        // Send read receipts via WebSocket
        unreadMessages.forEach((id) => sendReadReceipt(id));
      }
    }
  }, [messages, currentUserId, otherUserId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('http://localhost:3000/api/v1/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: otherUserId,
          content,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: (newMessage) => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Send via WebSocket for real-time delivery
      if (isConnected) {
        sendMessage(otherUserId, newMessage.content);
      }
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (isConnected && otherUserId) {
      sendTypingIndicator(otherUserId, e.target.value.length > 0);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateDivider = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const shouldShowDateDivider = (currentMsg: Message, prevMsg: Message | undefined) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
  };

  // Show loading state while auth is being verified or token/userId is being loaded
  if (!mounted || authLoading || (user && (!token || !currentUserId))) {
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
      <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
        {/* Conversation Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/messages')}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          {otherUser ? (
            <div className="flex items-center gap-3 flex-1">
              {otherUser.avatar_url ? (
                <Image
                  src={otherUser.avatar_url}
                  alt={otherUser.username}
                  width={40}
                  height={40}
                  unoptimized
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {otherUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900">{otherUser.username}</h2>
                {isTyping && (
                  <p className="text-sm text-gray-500 italic">typing...</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : messages && messages.length > 0 ? (
            messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const showDateDivider = shouldShowDateDivider(
                message,
                index > 0 ? messages[index - 1] : undefined
              );

              return (
                <div key={message.id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        {formatDateDivider(message.created_at)}
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <div
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTimestamp(message.created_at)}
                        {isOwnMessage && message.is_read && (
                          <span className="ml-1">• Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={handleTyping}
              onBlur={() => isConnected && sendTypingIndicator(otherUserId, false)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
