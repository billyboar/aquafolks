'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
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
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const response = await api.post(
        `/api/v1/${commentableType}/${commentableId}/comments`,
        { content: input.content, image_urls: input.image_urls }
      );
      return response.data;
    },
    onSuccess: () => {
      setContent('');
      attachedImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setAttachedImages([]);

      queryClient.invalidateQueries({
        queryKey: ['comments', commentableType, commentableId],
      });

      onCommentAdded?.();
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - attachedImages.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setAttachedImages((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(attachedImages[index].preview);
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let imageUrls: string[] = [];

    if (attachedImages.length > 0) {
      setUploading(true);
      try {
        for (const img of attachedImages) {
          const formData = new FormData();
          formData.append('image', img.file);
          const res = await api.post('/api/v1/comments/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          imageUrls.push(res.data.image_url);
        }
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    createCommentMutation.mutate({
      commentable_type: commentableType,
      commentable_id: commentableId,
      content: content.trim(),
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
    });
  };

  const isPending = uploading || createCommentMutation.isPending;

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
          disabled={isPending}
        />
      </div>

      {/* Image previews */}
      {attachedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedImages.map((img, i) => (
            <div key={i} className="relative group w-20 h-20">
              <Image
                src={img.preview}
                alt="attachment preview"
                fill
                className="object-cover rounded-lg"
                unoptimized
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          {attachedImages.length < 4 && (
            <label className="cursor-pointer text-sm text-text-secondary hover:text-text transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                disabled={isPending}
              />
            </label>
          )}
        </div>

        <div className="flex gap-3">
          {(content.trim() || attachedImages.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setContent('');
                attachedImages.forEach((img) => URL.revokeObjectURL(img.preview));
                setAttachedImages([]);
              }}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? 'Uploading...' : createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      {createCommentMutation.isError && (
        <p className="text-sm text-red-600">
          Failed to post comment. Please try again.
        </p>
      )}
    </form>
  );
}
