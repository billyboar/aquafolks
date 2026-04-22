'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PhotoViewerProps {
  photos: { url: string; caption?: string }[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentPhoto = photos[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, scale]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetZoom();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetZoom();
    }
  };

  const zoomIn = () => {
    setScale(Math.min(scale * 1.3, 5));
  };

  const zoomOut = () => {
    setScale(Math.max(scale / 1.3, 1));
    if (scale <= 1.3) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-colors"
        aria-label="Close"
      >
        ×
      </button>

      {/* Image counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-4 z-50 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-white/10 rounded-full p-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomOut();
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetZoom();
          }}
          className="px-4 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-colors"
          aria-label="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomIn();
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-colors"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          {currentIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-colors"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <div
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          className="relative max-w-[90vw] max-h-[90vh]"
        >
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.caption || 'Photo'}
            width={1200}
            height={900}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
            unoptimized
            priority
          />
        </div>
      </div>

      {/* Caption */}
      {currentPhoto.caption && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl px-6 py-3 bg-black/50 text-white text-center rounded-lg">
          {currentPhoto.caption}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-white/60 text-xs text-center">
        Use arrow keys to navigate • Scroll or +/- to zoom • ESC to close
      </div>
    </div>
  );
}
