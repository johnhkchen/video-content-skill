# R2 Setup: Cloudflare Object Storage

Setup guide for Cloudflare R2. For other options, see `routes/self-host.md` or the provider comparison in `SKILL.md`.

---

## Why R2?

| Factor | R2 | S3 | Vercel Blob | Cloudinary |
|--------|----|----|-------------|------------|
| Egress | **$0** | ~$0.09/GB | $0.15/GB | Included |
| Free storage | 10GB | 5GB (12mo) | 1GB | 25 credits |
| S3 compatible | Yes | Native | No | No |
| Setup complexity | Medium | Higher | Low | Lowest |
| Transcoding | No | No | No | **Yes** |

**R2's edge**: Zero egress at any scale. If your video goes viral, you don't get a surprise bill.

**R2's weakness**: Another account to manage, custom domains require Cloudflare DNS, no transcoding.

### Why Does Cloudflare Offer Zero Egress?

It's not charity—it's strategic, similar to Twilio's model:

1. **Land and expand**: R2 gets you into the Cloudflare ecosystem. Storage is the wedge product.

2. **They own the pipes**: Cloudflare runs one of the world's largest networks. Marginal cost is near-zero.

3. **Attack AWS's profit center**: S3 egress is Amazon's cash cow. By making it free, Cloudflare disrupts that.

4. **Network effects**: More content = more valuable network = better peering deals.

**What this means for you**: The zero egress is real and sustainable. But you're entering an ecosystem with natural pull toward other Cloudflare products.

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
- Requires domain on Cloudflare DNS

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

---

## Not Happy with R2?

- **Want simpler**: Cloudinary (drag-and-drop, see `routes/emergency.md`)
- **Already on AWS**: S3 + CloudFront (see `routes/existing-s3.md`)
- **Want to self-host**: VPS, MinIO, Ceph (see `routes/self-host.md`)
- **On Vercel**: Vercel Blob has tighter integration
