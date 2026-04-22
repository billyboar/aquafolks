'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LikeStats } from '@/lib/types';

interface LikeButtonProps {
  likeableType: string;
  likeableId: string;
  showCount?: boolean;
  className?: string;
}

export default function LikeButton({
  likeableType,
  likeableId,
  showCount = true,
  className = '',
}: LikeButtonProps) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch like stats
  const { data: stats } = useQuery<LikeStats>({
    queryKey: ['likes', likeableType, likeableId],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/${likeableType}/${likeableId}/likes`
      );
      return response.data;
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/v1/${likeableType}/${likeableId}/like`);
      return response.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['likes', likeableType, likeableId],
      });

      // Snapshot the previous value
      const previousStats = queryClient.getQueryData<LikeStats>([
        'likes',
        likeableType,
        likeableId,
      ]);

      // Optimistically update
      if (previousStats) {
        queryClient.setQueryData<LikeStats>(
          ['likes', likeableType, likeableId],
          {
            like_count: previousStats.is_liked
              ? previousStats.like_count - 1
              : previousStats.like_count + 1,
            is_liked: !previousStats.is_liked,
          }
        );
      }

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      return { previousStats };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['likes', likeableType, likeableId],
          context.previousStats
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: ['likes', likeableType, likeableId],
      });
    },
  });

  const handleClick = () => {
    toggleLikeMutation.mutate();
  };

  const isLiked = stats?.is_liked || false;
  const count = stats?.like_count || 0;

  return (
    <button
      onClick={handleClick}
      disabled={toggleLikeMutation.isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isLiked
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-surface border border-border hover:bg-surface-hover'
      } ${isAnimating ? 'scale-110' : 'scale-100'} ${className}`}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <svg
        className={`w-5 h-5 transition-all ${
          isAnimating ? 'scale-125' : 'scale-100'
        }`}
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isLiked ? 0 : 2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {showCount && <span className="font-medium">{count}</span>}
    </button>
  );
}
