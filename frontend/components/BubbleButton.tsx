'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LikeStats } from '@/lib/types';

interface BubbleButtonProps {
  likeableType: string;
  likeableId: string;
  showCount?: boolean;
  className?: string;
}

export default function BubbleButton({
  likeableType,
  likeableId,
  showCount = true,
  className = '',
}: BubbleButtonProps) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: stats } = useQuery<LikeStats>({
    queryKey: ['likes', likeableType, likeableId],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/${likeableType}/${likeableId}/likes`
      );
      return response.data;
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/v1/${likeableType}/${likeableId}/like`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['likes', likeableType, likeableId],
      });

      const previousStats = queryClient.getQueryData<LikeStats>([
        'likes',
        likeableType,
        likeableId,
      ]);

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

      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);

      return { previousStats };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['likes', likeableType, likeableId],
          context.previousStats
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['likes', likeableType, likeableId],
      });
    },
  });

  const handleClick = () => toggleLikeMutation.mutate();

  const isBubbled = stats?.is_liked || false;
  const count = stats?.like_count || 0;

  return (
    <button
      onClick={handleClick}
      disabled={toggleLikeMutation.isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        isBubbled
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-surface border border-border hover:bg-surface-hover text-on-surface-variant'
      } ${isAnimating ? 'scale-110' : 'scale-100'} ${className}`}
      aria-label={isBubbled ? 'Unbubble' : 'Bubble'}
    >
      {/* Stacked rising bubbles icon */}
      <svg
        className={`w-5 h-5 transition-transform duration-300 ${
          isAnimating ? 'scale-125' : 'scale-100'
        }`}
        viewBox="0 0 24 24"
        fill={isBubbled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isBubbled ? 0 : 1.75}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Large bubble — bottom */}
        <circle cx="10" cy="17" r="4" />
        {/* Medium bubble — middle right */}
        <circle cx="17" cy="11" r="2.75" />
        {/* Small bubble — top */}
        <circle cx="13" cy="5.5" r="1.75" />
      </svg>
      {showCount && <span className="font-medium tabular-nums">{count}</span>}
    </button>
  );
}
