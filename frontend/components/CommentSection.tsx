'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import CommentForm from './CommentForm';
import type { Comment } from '@/lib/types';

interface CommentSectionProps {
  commentableType: string;
  commentableId: string;
}

function CommentItem({
  comment,
  onDelete,
}: {
  comment: Comment;
  onDelete: (id: string) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get current user from localStorage
  const currentUserId =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}')?.id
      : null;

  const isOwner = currentUserId === comment.user_id;

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

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
          {comment.user?.display_name?.[0]?.toUpperCase() ||
            comment.user?.username?.[0]?.toUpperCase() ||
            'U'}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-medium text-text">
                {comment.user?.display_name || comment.user?.username || 'Unknown User'}
              </p>
              <p className="text-xs text-text-secondary">
                {formatTimeAgo(comment.created_at)}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-text-secondary hover:text-red-600 transition-colors"
                aria-label="Delete comment"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          <p className="text-text whitespace-pre-wrap">{comment.content}</p>
        </div>

        {showDeleteConfirm && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 mb-2">
              Are you sure you want to delete this comment?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDelete(comment.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({
  commentableType,
  commentableId,
}: CommentSectionProps) {
  const queryClient = useQueryClient();

  // Fetch comments
  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Comment[]>({
    queryKey: ['comments', commentableType, commentableId],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/${commentableType}/${commentableId}/comments`
      );
      return response.data;
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/api/v1/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', commentableType, commentableId],
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Comments</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Comments</h2>
        <p className="text-red-600">Failed to load comments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Comments {comments && comments.length > 0 && `(${comments.length})`}
        </h2>
        <CommentForm
          commentableType={commentableType}
          commentableId={commentableId}
        />
      </div>

      {comments && comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={(id) => deleteCommentMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {comments && comments.length === 0 && (
        <p className="text-center text-text-secondary py-8">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
