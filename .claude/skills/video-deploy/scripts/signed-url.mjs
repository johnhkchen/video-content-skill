/**
 * signed-url.mjs - Generate signed URLs for private video access
 *
 * This module can be imported into your application or used standalone.
 *
 * Usage as module:
 *   import { createVideoUrlGenerator } from './signed-url.mjs';
 *   const getVideoUrl = createVideoUrlGenerator('r2');
 *   const url = await getVideoUrl('videos/private-demo.mp4');
 *
 * Usage as CLI:
 *   node signed-url.mjs r2 videos/demo.mp4
 *   node signed-url.mjs s3 media/intro.mp4 --expires=7200
 *
 * Environment variables:
 *   For R2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *   For S3: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Create a video URL generator for the specified provider
 * @param {'r2' | 's3'} provider - The cloud storage provider
 * @param {Object} options - Configuration options
 * @param {number} options.expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Function} Async function that generates signed URLs
 */
export function createVideoUrlGenerator(provider, options = {}) {
  const { expiresIn = 3600 } = options;

  let client;
  let bucketName;

  if (provider === 'r2') {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME'
      );
    }

    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  } else if (provider === 's3') {
    const region = process.env.AWS_REGION || 'us-east-1';
    bucketName = process.env.S3_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('Missing S3_BUCKET_NAME environment variable');
    }

    client = new S3Client({ region });
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  /**
   * Generate a signed URL for a video file
   * @param {string} videoKey - The object key (path) of the video in the bucket
   * @param {number} [customExpiresIn] - Optional custom expiration time in seconds
   * @returns {Promise<string>} The signed URL
   */
  return async function getVideoUrl(videoKey, customExpiresIn) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: videoKey,
    });

    return getSignedUrl(client, command, {
      expiresIn: customExpiresIn || expiresIn,
    });
  };
}

/**
 * Example Express.js middleware for serving private videos
 *
 * Usage:
 *   import { createVideoMiddleware } from './signed-url.mjs';
 *   app.get('/api/video/:videoId', createVideoMiddleware('r2'));
 */
export function createVideoMiddleware(provider, options = {}) {
  const getVideoUrl = createVideoUrlGenerator(provider, options);

  return async (req, res, next) => {
    try {
      const { videoId } = req.params;
      const videoKey = `videos/${videoId}.mp4`; // Customize path pattern as needed

      const signedUrl = await getVideoUrl(videoKey);

      // Option 1: Redirect to signed URL
      res.redirect(signedUrl);

      // Option 2: Return JSON with URL (uncomment if preferred)
      // res.json({ url: signedUrl, expiresIn: options.expiresIn || 3600 });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Example Next.js API route handler
 *
 * Usage in pages/api/video/[id].js:
 *   import { createNextApiHandler } from './signed-url.mjs';
 *   export default createNextApiHandler('r2');
 */
export function createNextApiHandler(provider, options = {}) {
  const getVideoUrl = createVideoUrlGenerator(provider, options);

  return async (req, res) => {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Video ID required' });
    }

    try {
      const videoKey = `videos/${id}.mp4`;
      const signedUrl = await getVideoUrl(videoKey);

      res.redirect(302, signedUrl);
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      res.status(500).json({ error: 'Failed to generate video URL' });
    }
  };
}

// CLI mode
if (process.argv[1].endsWith('signed-url.mjs')) {
  const args = process.argv.slice(2);
  const provider = args[0];
  const videoKey = args[1];

  let expiresIn = 3600;
  for (const arg of args.slice(2)) {
    if (arg.startsWith('--expires=')) {
      expiresIn = parseInt(arg.slice(10), 10);
    }
  }

  if (!provider || !videoKey) {
    console.log(`
Usage: node signed-url.mjs <provider> <video-key> [--expires=<seconds>]

Providers: r2, s3

Examples:
  node signed-url.mjs r2 videos/demo.mp4
  node signed-url.mjs s3 media/intro.mp4 --expires=7200
    `);
    process.exit(1);
  }

  try {
    const getVideoUrl = createVideoUrlGenerator(provider, { expiresIn });
    const url = await getVideoUrl(videoKey);
    console.log('\n📎 Signed URL (expires in', expiresIn, 'seconds):');
    console.log(url);
    console.log('');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}
