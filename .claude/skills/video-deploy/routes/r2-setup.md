# R2 Setup: Standard Public Video Hosting

One option for static videos on production deployments.

## Before You Start: Is R2 Right for You?

R2 is a good default, but not the only choice. Consider alternatives if:

| Situation | Maybe Use Instead |
|-----------|-------------------|
| Already on AWS | S3 + CloudFront (ecosystem consistency) |
| Already on Vercel | Vercel Blob (tighter integration) |
| Want zero config | Cloudinary (drag-and-drop, auto-transcode) |
| Already on DigitalOcean | DO Spaces ($5/mo flat) |
| Tiny known scale | Whatever you already have |

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

1. **Land and expand**: R2 gets you into the Cloudflare ecosystem. Once your videos are there, you'll likely add Workers, CDN, DNS, security products. Storage is the wedge.

2. **They already own the pipes**: Cloudflare runs one of the world's largest networks. Your egress runs over infrastructure they've already paid for. Marginal cost is near-zero.

3. **Attack AWS's profit center**: S3 egress is a cash cow for Amazon. By making it free, Cloudflare disrupts that and pulls developers away from AWS.

4. **Network effects**: More content on Cloudflare = more valuable network = better peering deals = lower costs. Your videos make their network stronger.

**What this means for you**: The zero egress is real and sustainable—it's not a loss-leader that'll disappear. But know that you're entering an ecosystem with natural pull toward other Cloudflare products.

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

---

## Alternatives If R2 Isn't Working Out

### Cloudinary (Simpler)
If R2 setup feels like too much friction:
1. Sign up at cloudinary.com
2. Drag-and-drop upload in dashboard
3. Copy URL, paste in code
4. Done. No CLI, no credentials, no CORS config.

Trade-off: 25 credits/month free tier, then paid.

### Vercel Blob (If on Vercel)
```bash
npm i @vercel/blob
```
```javascript
import { put } from '@vercel/blob';
const { url } = await put('video.mp4', file, { access: 'public' });
```
Trade-off: $0.15/GB egress, but native Vercel integration.

### Bunny CDN (Simple Pricing)
- ~$0.01/GB egress
- No free tier, but predictable costs
- Good performance, simple dashboard
- bunny.net

### Backblaze B2 + Cloudflare (Free Egress via Alliance)
If you want free egress but not R2:
- Backblaze B2 storage
- Cloudflare CDN in front (Bandwidth Alliance = free)
- More setup, but vendor-diverse

### Self-Host: "I Want to Own the Stack"

If you'd rather understand and control everything than depend on managed services:

**Minimal setup: nginx + any VPS**
```nginx
# /etc/nginx/sites-available/videos
server {
    listen 443 ssl;
    server_name videos.yourdomain.com;

    root /var/www/videos;

    location / {
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

**Costs:**
- $5-10/mo VPS (DigitalOcean, Hetzner, Linode)
- Bandwidth usually 1-5TB included
- You control everything

**When this makes sense:**
- You already run servers
- Traffic is predictable (not viral spikes)
- You want to learn/understand the infrastructure
- You're allergic to vendor lock-in
- Compliance requires knowing where data lives

**When it doesn't:**
- You don't want to manage servers
- Traffic could spike unpredictably (VPS bandwidth overage is expensive)
- You need a CDN for global performance
- Uptime matters and you don't have ops experience

**Middle ground: VPS + Cloudflare CDN**
- Host origin on your VPS
- Put Cloudflare (free tier) in front
- Get CDN caching without giving up control of origin
- Cloudflare caches video, your VPS barely gets hit

The managed services exist because most people don't want to think about nginx configs and disk space. But if you do, a $6/mo Hetzner box with 20TB bandwidth will outperform any free tier.
