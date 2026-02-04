/**
 * Template: Video Configuration Module
 *
 * A centralized configuration for video URLs that works across
 * development and production environments.
 */

// ============================================================================
// Basic Configuration (Environment-based switching)
// ============================================================================

export const VIDEO_CONFIG = {
  // Base URL for video CDN - set via environment variable in production
  baseUrl: process.env.VIDEO_CDN_URL
    || process.env.NEXT_PUBLIC_VIDEO_CDN_URL
    || process.env.REACT_APP_VIDEO_CDN_URL
    || process.env.VITE_VIDEO_CDN_URL
    || '/videos',

  // Default video format
  defaultFormat: 'mp4' as const,

  // Supported formats for multi-source fallback
  formats: ['webm', 'mp4'] as const,
} as const;

/**
 * Get the full URL for a video
 */
export function getVideoUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return `${VIDEO_CONFIG.baseUrl}/${cleanPath}`;
}

/**
 * Get URLs for all supported formats of a video
 * Useful for <source> elements with fallbacks
 */
export function getVideoSources(baseName: string): Array<{ src: string; type: string }> {
  return VIDEO_CONFIG.formats.map(format => ({
    src: getVideoUrl(`${baseName}.${format}`),
    type: `video/${format}`,
  }));
}

// ============================================================================
// Advanced Configuration (With video manifest)
// ============================================================================

/**
 * Video manifest - useful for larger projects with many videos
 * Maps video IDs to their paths and metadata
 */
export const VIDEO_MANIFEST = {
  'hero': {
    path: 'hero/main.mp4',
    poster: 'hero/poster.jpg',
    duration: 45,
  },
  'demo': {
    path: 'demos/product-demo.mp4',
    poster: 'demos/product-demo-poster.jpg',
    duration: 180,
  },
  'testimonial-1': {
    path: 'testimonials/customer-1.mp4',
    poster: 'testimonials/customer-1-poster.jpg',
    duration: 60,
  },
} as const;

export type VideoId = keyof typeof VIDEO_MANIFEST;

/**
 * Get video details by ID
 */
export function getVideo(id: VideoId) {
  const video = VIDEO_MANIFEST[id];
  return {
    ...video,
    url: getVideoUrl(video.path),
    posterUrl: getVideoUrl(video.poster),
  };
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Simple usage
import { getVideoUrl } from './video-config';

<video src={getVideoUrl('demo.mp4')} />

// With manifest
import { getVideo } from './video-config';

const heroVideo = getVideo('hero');
<video
  src={heroVideo.url}
  poster={heroVideo.posterUrl}
/>

// Multi-source with fallbacks
import { getVideoSources } from './video-config';

<video>
  {getVideoSources('demo').map(source => (
    <source key={source.type} src={source.src} type={source.type} />
  ))}
</video>
*/
