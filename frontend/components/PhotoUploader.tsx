"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';

interface PhotoFile {
  file: File;
  preview: string;
  caption?: string;
}

interface PhotoUploaderProps {
  photos: PhotoFile[];
  onPhotosChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
}

export default function PhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  maxSizeMB = 10,
}: PhotoUploaderProps) {
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');

    // Check total count
    if (photos.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    // Validate and process files
    const newPhotos: PhotoFile[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (const file of files) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Check file size
      if (file.size > maxBytes) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview, caption: '' });
    }

    onPhotosChange([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    onPhotosChange(newPhotos);
  };

  const updateCaption = (index: number, caption: string) => {
    const newPhotos = [...photos];
    newPhotos[index].caption = caption;
    onPhotosChange(newPhotos);
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos ({photos.length}/{maxPhotos})
        </label>
        
        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
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

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        
        <p className="mt-1 text-sm text-gray-500">
          Upload up to {maxPhotos} photos. Max {maxSizeMB}MB each.
        </p>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              {/* Photo preview */}
              <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={photo.preview}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Primary badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Move buttons */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(index, index - 1)}
                      className="bg-white text-gray-700 p-1 rounded shadow"
                      title="Move left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {index < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(index, index + 1)}
                      className="bg-white text-gray-700 p-1 rounded shadow"
                      title="Move right"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Caption input */}
              <input
                type="text"
                value={photo.caption || ''}
                onChange={(e) => updateCaption(index, e.target.value)}
                placeholder="Add caption (optional)"
                className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
