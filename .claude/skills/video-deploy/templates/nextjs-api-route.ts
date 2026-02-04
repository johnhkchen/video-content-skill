/**
 * Template: Next.js API Route for Private Videos
 *
 * This API route generates signed URLs for private videos stored in R2/S3.
 * Use this when videos should only be accessible to authenticated users.
 *
 * File: app/api/video/[id]/route.ts (App Router)
 *   or: pages/api/video/[id].ts (Pages Router)
 */

// ============================================================================
// App Router Version (Next.js 13+)
// File: app/api/video/[id]/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;

  // Optional: Add authentication check here
  // const session = await getServerSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `videos/${videoId}.mp4`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Option 1: Redirect to signed URL (recommended for video playback)
    return NextResponse.redirect(signedUrl);

    // Option 2: Return URL in JSON (for custom player implementations)
    // return NextResponse.json({ url: signedUrl, expiresIn: 3600 });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return NextResponse.json(
      { error: 'Video not found' },
      { status: 404 }
    );
  }
}

// ============================================================================
// Pages Router Version (Next.js 12 and earlier)
// File: pages/api/video/[id].ts
// ============================================================================

/*
import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Video ID required' });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `videos/${id}.mp4`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.redirect(302, signedUrl);
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    res.status(404).json({ error: 'Video not found' });
  }
}
*/

// ============================================================================
// Environment Variables Required
// ============================================================================

/*
Add these to your .env.local (development) and deployment platform:

R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-video-bucket

For S3, replace the client initialization with:

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

And use S3_BUCKET_NAME instead of R2_BUCKET_NAME.
*/

// ============================================================================
// Client-Side Usage
// ============================================================================

/*
// In your React component:

function PrivateVideoPlayer({ videoId }: { videoId: string }) {
  // The API route handles authentication and returns a redirect to signed URL
  return (
    <video
      src={`/api/video/${videoId}`}
      controls
    />
  );
}

// Or if using the JSON response option:

function PrivateVideoPlayer({ videoId }: { videoId: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/video/${videoId}`)
      .then(res => res.json())
      .then(data => setVideoUrl(data.url));
  }, [videoId]);

  if (!videoUrl) return <div>Loading...</div>;

  return <video src={videoUrl} controls />;
}
*/
