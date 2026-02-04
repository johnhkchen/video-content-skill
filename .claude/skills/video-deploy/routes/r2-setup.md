# R2 Setup: Standard Public Video Hosting

Recommended path for static videos on production deployments.

## Why R2?

| Factor | R2 | S3 |
|--------|----|----|
| Egress | **$0** | ~$0.09/GB |
| 100 viewers × 1GB video | $0 | ~$9 |
| Free storage | 10GB | 5GB (12mo) |
| S3 compatible | Yes | Native |

If you already have AWS infrastructure, S3 is fine. Otherwise, R2 is cheaper for video.

---

## Step 1: Account & Bucket

```bash
# Install Cloudflare CLI
npm install -g wrangler

# Login (opens browser)
wrangler login

# Create bucket
wrangler r2 bucket create video-assets

# Verify
wrangler r2 bucket list
```

---

## Step 2: Public Access

In Cloudflare Dashboard → R2 → video-assets → Settings:

**Option A: r2.dev subdomain** (quick)
- Enable under "Public access"
- URL: `https://pub-xxx.r2.dev/`

**Option B: Custom domain** (recommended)
- Connect `videos.yourdomain.com`
- Requires domain on Cloudflare

---

## Step 3: CORS Configuration

In bucket settings, add CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

Use `["*"]` for development, specific domain for production.

---

## Step 4: API Credentials

1. R2 → Manage R2 API Tokens → Create API Token
2. Permission: "Admin Read & Write" for your bucket
3. Save: Account ID, Access Key ID, Secret Access Key

---

## Step 5: Upload Videos

```bash
# Set credentials
export R2_ACCOUNT_ID="your-account-id"
export AWS_ACCESS_KEY_ID="your-r2-access-key"
export AWS_SECRET_ACCESS_KEY="your-r2-secret-key"
export R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Upload single file
aws s3 cp ./public/videos/demo.mp4 s3://video-assets/demo.mp4 \
  --endpoint-url "$R2_ENDPOINT" \
  --content-type "video/mp4"

# Upload directory
aws s3 sync ./public/videos s3://video-assets/videos \
  --endpoint-url "$R2_ENDPOINT"
```

Or use the upload script: `scripts/upload-videos.sh r2 ./public/videos video-assets`

---

## Step 6: Update Code

Create video config (see `templates/video-config.ts`):

```javascript
export const VIDEO_BASE_URL =
  process.env.NEXT_PUBLIC_VIDEO_CDN_URL ||
  process.env.VITE_VIDEO_CDN_URL ||
  '/videos';

export const getVideoUrl = (path) =>
  `${VIDEO_BASE_URL}/${path.replace(/^\//, '')}`;
```

Update components:

```jsx
import { getVideoUrl } from '@/config/video';

<video src={getVideoUrl('demo.mp4')} controls />
```

---

## Step 7: Environment Variables

Set in deployment platform (Vercel, Netlify, etc.):

```
NEXT_PUBLIC_VIDEO_CDN_URL=https://videos.yourdomain.com
```

Framework prefixes: see `reference/frameworks.md`

---

## Step 8: Verify

1. Deploy
2. Open DevTools → Network
3. Confirm videos load from CDN URL
4. Check console for CORS errors

---

## Troubleshooting

See `reference/troubleshooting.md` for common issues.
