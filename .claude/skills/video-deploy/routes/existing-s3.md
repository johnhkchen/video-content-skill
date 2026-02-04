# Using Existing S3

User already has AWS infrastructure. Help them use it.

## Don't Recommend Switching

If they're already in AWS ecosystem, S3 is fine. Don't push R2 unless:
- They explicitly ask about costs
- Video egress is becoming expensive
- They're setting up fresh anyway

---

## Quick Checklist

### 1. CORS Configuration

Bucket → Permissions → CORS:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. Bucket Policy (if public)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket/videos/*"
  }]
}
```

### 3. Upload with Content-Type

```bash
aws s3 cp video.mp4 s3://bucket/videos/video.mp4 \
  --content-type "video/mp4"
```

Without `--content-type`, browser may not play video correctly.

### 4. Direct S3 URL

```
https://your-bucket.s3.us-east-1.amazonaws.com/videos/demo.mp4
```

This works but: no CDN, egress costs on every view.

---

## Recommended: Add CloudFront

CDN improves performance and can reduce costs.

### Create Distribution

1. CloudFront → Create Distribution
2. Origin: Your S3 bucket
3. Viewer Protocol: Redirect HTTP to HTTPS
4. Cache Policy: CachingOptimized
5. Wait for deployment (~5-10 min)

### Use CloudFront URL

```
https://d123abc.cloudfront.net/videos/demo.mp4
```

---

## Cost Warning

S3 egress: ~$0.09/GB

| Scenario | Monthly Egress | Cost |
|----------|---------------|------|
| 10 viewers × 100MB video | 1GB | ~$0.09 |
| 100 viewers × 1GB video | 100GB | ~$9 |
| 1000 viewers × 1GB video | 1TB | ~$90 |

If video is core to the product, consider R2 migration (zero egress).

---

## Code Integration

Same pattern as R2:

```javascript
export const VIDEO_BASE_URL =
  process.env.NEXT_PUBLIC_VIDEO_CDN_URL ||
  '/videos';

// Set in production:
// NEXT_PUBLIC_VIDEO_CDN_URL=https://d123abc.cloudfront.net
```

---

## Private Videos on S3

Use presigned URLs (same pattern as `routes/signed-urls.md`):

```javascript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({ region: 'us-east-1' });

const url = await getSignedUrl(
  client,
  new GetObjectCommand({ Bucket: 'bucket', Key: 'video.mp4' }),
  { expiresIn: 3600 }
);
```
