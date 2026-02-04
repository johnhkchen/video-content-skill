/**
 * Template: React Video Component Migration
 *
 * This template shows how to convert a React component from local video files
 * to using cloud-hosted videos with environment-based URL switching.
 */

// ============================================================================
// BEFORE: Local video files (works in development, fails in production)
// ============================================================================

/*
import React from 'react';

export function VideoPlayer({ videoId }: { videoId: string }) {
  return (
    <video
      src={`/videos/${videoId}.mp4`}
      controls
      autoPlay
      muted
    />
  );
}

export function HeroVideo() {
  return (
    <video
      src="/videos/hero-background.mp4"
      autoPlay
      loop
      muted
      playsInline
    />
  );
}
*/

// ============================================================================
// AFTER: Cloud-hosted videos with environment switching
// ============================================================================

import React from 'react';

// Configuration: Use environment variable for CDN URL
const VIDEO_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_CDN_URL
  || process.env.REACT_APP_VIDEO_CDN_URL
  || process.env.VITE_VIDEO_CDN_URL
  || '/videos'; // Fallback to local for development

/**
 * Get the full URL for a video file
 */
export function getVideoUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${VIDEO_BASE_URL}/${cleanPath}`;
}

/**
 * VideoPlayer component - now works in both dev and production
 */
export function VideoPlayer({ videoId }: { videoId: string }) {
  const videoUrl = getVideoUrl(`${videoId}.mp4`);

  return (
    <video
      src={videoUrl}
      controls
      autoPlay
      muted
    />
  );
}

/**
 * HeroVideo component with cloud-hosted video
 */
export function HeroVideo() {
  return (
    <video
      src={getVideoUrl('hero-background.mp4')}
      autoPlay
      loop
      muted
      playsInline
    />
  );
}

/**
 * Video component with multiple sources for browser compatibility
 */
export function VideoWithFallback({
  name,
  ...props
}: { name: string } & React.VideoHTMLAttributes<HTMLVideoElement>) {
  return (
    <video {...props}>
      <source src={getVideoUrl(`${name}.webm`)} type="video/webm" />
      <source src={getVideoUrl(`${name}.mp4`)} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

/*
In your deployment platform (Vercel, Netlify, etc.), set:

  VIDEO_CDN_URL=https://videos.yourdomain.com

Or for specific frameworks:
  - Next.js: NEXT_PUBLIC_VIDEO_CDN_URL
  - Create React App: REACT_APP_VIDEO_CDN_URL
  - Vite: VITE_VIDEO_CDN_URL

The component will automatically use local /videos path in development
and the CDN URL in production.
*/
