'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateCommentInput } from '@/lib/types';

interface CommentFormProps {
  commentableType: string;
  commentableId: string;
  onCommentAdded?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function CommentForm({
  commentableType,
  commentableId,
  onCommentAdded,
  placeholder = 'Add a comment...',
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const response = await api.post(
        `/api/v1/${commentableType}/${commentableId}/comments`,
        { content: input.content }
      );
      return response.data;
    },
    onSuccess: () => {
      // Reset form
      setContent('');

      // Invalidate comments query to refetch
      queryClient.invalidateQueries({
        queryKey: ['comments', commentableType, commentableId],
      });

      // Call optional callback
      onCommentAdded?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    createCommentMutation.mutate({
      commentable_type: commentableType,
      commentable_id: commentableId,
      content: content.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={3}
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          disabled={createCommentMutation.isPending}
        />
      </div>

      <div className="flex justify-end gap-3">
        {content.trim() && (
          <button
            type="button"
            onClick={() => setContent('')}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text transition-colors"
            disabled={createCommentMutation.isPending}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || createCommentMutation.isPending}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
        </button>
      </div>

      {createCommentMutation.isError && (
        <p className="text-sm text-red-600">
          Failed to post comment. Please try again.
        </p>
      )}
    </form>
  );
}
