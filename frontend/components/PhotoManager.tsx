"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface ExistingPhoto {
  id: string;
  url: string;
  caption: string;
  is_primary: boolean;
  order: number;
}

interface NewPhotoFile {
  file: File;
  preview: string;
  caption: string;
}

interface PhotoManagerProps {
  tankId: string;
  existingPhotos: ExistingPhoto[];
  onPhotosChange: () => void;
}

export default function PhotoManager({
  tankId,
  existingPhotos: initialPhotos,
  onPhotosChange,
}: PhotoManagerProps) {
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(initialPhotos);
  const [newPhotos, setNewPhotos] = useState<NewPhotoFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxPhotos = 10;
  const maxSizeMB = 10;
  const totalPhotos = existingPhotos.length + newPhotos.length;

  // Sync existing photos when initialPhotos changes
  useEffect(() => {
    setExistingPhotos(initialPhotos);
  }, [initialPhotos]);

  // Handle new file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');

    if (totalPhotos + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const validFiles: NewPhotoFile[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > maxBytes) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      validFiles.push({ file, preview, caption: '' });
    }

    setNewPhotos([...newPhotos, ...validFiles]);
  };

  // Upload new photos
  const uploadNewPhotos = async () => {
    if (newPhotos.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (const photo of newPhotos) {
        const formData = new FormData();
        formData.append('photo', photo.file);
        formData.append('caption', photo.caption);
        formData.append('is_primary', 'false'); // Don't auto-set as primary

        await api.post(`/api/v1/tanks/${tankId}/photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Clear new photos and refresh
      newPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setNewPhotos([]);
      onPhotosChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  // Delete existing photo
  const deleteExistingPhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/api/v1/photos/${photoId}`);
      setExistingPhotos(existingPhotos.filter(p => p.id !== photoId));
      onPhotosChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete photo');
    }
  };

  // Set photo as primary
  const setPrimaryPhoto = async (photoId: string) => {
    try {
      await api.put(`/api/v1/photos/${photoId}/set-primary`);
      setExistingPhotos(existingPhotos.map(p => ({
        ...p,
        is_primary: p.id === photoId
      })));
      onPhotosChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set primary photo');
    }
  };

  // Update caption
  const updateCaption = async (photoId: string, caption: string) => {
    try {
      await api.put(`/api/v1/photos/${photoId}/caption`, { caption });
      setExistingPhotos(existingPhotos.map(p => 
        p.id === photoId ? { ...p, caption } : p
      ));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update caption');
    }
  };

  // Remove new photo before upload
  const removeNewPhoto = (index: number) => {
    const photo = newPhotos[index];
    URL.revokeObjectURL(photo.preview);
    setNewPhotos(newPhotos.filter((_, i) => i !== index));
  };

  // Update new photo caption
  const updateNewPhotoCaption = (index: number, caption: string) => {
    const updated = [...newPhotos];
    updated[index].caption = caption;
    setNewPhotos(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Photos</h3>
          <p className="text-sm text-[hsl(var(--on-surface-variant))]">
            {totalPhotos}/{maxPhotos} photos
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={totalPhotos >= maxPhotos || uploading}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Photos
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Current Photos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={photo.url}
                    alt={photo.caption || 'Tank photo'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  
                  {photo.is_primary && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!photo.is_primary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryPhoto(photo.id)}
                        className="bg-blue-600 text-white p-1.5 rounded-full text-xs"
                        title="Set as primary"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteExistingPhoto(photo.id)}
                      className="bg-red-600 text-white p-1.5 rounded-full"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updateCaption(photo.id, e.target.value)}
                  placeholder="Add caption"
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Photos (not yet uploaded) */}
      {newPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">New Photos ({newPhotos.length})</h4>
            <button
              type="button"
              onClick={uploadNewPhotos}
              disabled={uploading}
              className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload New Photos'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {newPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  <Image
                    src={photo.preview}
                    alt={`New photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    New
                  </div>

                  <button
                    type="button"
                    onClick={() => removeNewPhoto(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updateNewPhotoCaption(index, e.target.value)}
                  placeholder="Add caption (optional)"
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPhotos === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-[hsl(var(--on-surface-variant))]">
            No photos yet. Click "Add Photos" to upload some!
          </p>
        </div>
      )}
    </div>
  );
}
