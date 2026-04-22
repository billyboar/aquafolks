'use client';

interface VideoEmbedProps {
  url: string;
  className?: string;
}

/**
 * Extracts video ID and platform from various video URLs
 * Supports: YouTube, Vimeo, Streamable, TikTok, Instagram, Google Drive
 */
function parseVideoUrl(url: string): { platform: string; videoId: string } | null {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return { platform: 'youtube', videoId: youtubeMatch[1] };
  }

  // Vimeo
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return { platform: 'vimeo', videoId: vimeoMatch[1] };
  }

  // Streamable
  const streamableRegex = /streamable\.com\/([a-zA-Z0-9]+)/;
  const streamableMatch = url.match(streamableRegex);
  if (streamableMatch) {
    return { platform: 'streamable', videoId: streamableMatch[1] };
  }

  // Google Drive
  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveMatch = url.match(driveRegex);
  if (driveMatch) {
    return { platform: 'drive', videoId: driveMatch[1] };
  }

  return null;
}

export default function VideoEmbed({ url, className = '' }: VideoEmbedProps) {
  const parsed = parseVideoUrl(url);

  if (!parsed) {
    // Fallback: try to embed as direct video URL
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <video
          src={url}
          controls
          className="w-full h-full"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  const { platform, videoId } = parsed;

  // YouTube embed
  if (platform === 'youtube') {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // Vimeo embed
  if (platform === 'vimeo') {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // Streamable embed
  if (platform === 'streamable') {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={`https://streamable.com/e/${videoId}`}
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // Google Drive embed
  if (platform === 'drive') {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={`https://drive.google.com/file/d/${videoId}/preview`}
          allow="autoplay"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return null;
}
