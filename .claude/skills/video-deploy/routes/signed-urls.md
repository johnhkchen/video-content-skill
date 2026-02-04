# Signed URLs: Private Video Access

For videos only authenticated users should see.

## How It Works

1. Videos stored in private bucket (no public access)
2. Server generates time-limited signed URL
3. Client uses signed URL to play video
4. URL expires, preventing unauthorized sharing

---

## Setup: Private R2 Bucket

Same as `routes/r2-setup.md` but **skip** enabling public access.

Bucket stays private. Access only via signed URLs.

---

## Server-Side: Generate Signed URL

Install dependencies:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Create utility (or use `scripts/signed-url.mjs`):

```javascript
// lib/video.js
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function getPrivateVideoUrl(videoKey, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: videoKey,
  });
  return getSignedUrl(client, command, { expiresIn });
}
```

---

## API Route Examples

### Next.js App Router

```javascript
// app/api/video/[id]/route.js
import { getPrivateVideoUrl } from '@/lib/video';
import { getServerSession } from 'next-auth';

export async function GET(request, { params }) {
  // Check authentication
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = await getPrivateVideoUrl(`videos/${params.id}.mp4`);
  return Response.redirect(url);
}
```

### Express

```javascript
app.get('/api/video/:id', requireAuth, async (req, res) => {
  const url = await getPrivateVideoUrl(`videos/${req.params.id}.mp4`);
  res.redirect(url);
});
```

---

## Client Usage

```jsx
function PrivateVideo({ videoId }) {
  // Option 1: Direct API call that redirects
  return <video src={`/api/video/${videoId}`} controls />;

  // Option 2: Fetch URL first (for more control)
  const [url, setUrl] = useState(null);
  useEffect(() => {
    fetch(`/api/video/${videoId}`)
      .then(r => r.json())
      .then(d => setUrl(d.url));
  }, [videoId]);

  if (!url) return <div>Loading...</div>;
  return <video src={url} controls />;
}
```

---

## Environment Variables

```bash
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=video-assets
```

**Never expose these to client.** Server-side only.

---

## Security Notes

- **URL expiration**: Default 1 hour. Shorter for sensitive content.
- **No DRM**: Determined users can still capture video. For true protection, use Mux or dedicated DRM.
- **Rate limiting**: Consider limiting URL generation per user.
- **Logging**: Track who accessed what for audit.
