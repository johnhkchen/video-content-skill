# User Uploads: When Users Submit Videos

This is NOT a simple hosting problem. Do not recommend basic R2/S3 setup.

## Why This Is Different

User uploads require:
- **Format validation**: Users upload anything (.mov, .avi, phone videos)
- **Transcoding**: Normalize to web-playable formats
- **Size limits**: Prevent abuse, manage storage
- **Progress tracking**: Large uploads need feedback
- **Potentially**: Thumbnails, moderation, quotas

Building this from scratch is weeks of work. Use a service.

---

## Recommended: Cloudinary

Best for most cases. Handles everything.

**Free tier**: 25 credits/month (~500 min SD video)
**Pricing**: $89/month for paid tier

### Quick Integration (React)

```bash
npm install cloudinary-react
```

```jsx
import { CloudinaryContext, Video } from 'cloudinary-react';

// Upload widget (client-side)
const widget = cloudinary.createUploadWidget(
  {
    cloudName: 'YOUR_CLOUD_NAME',
    uploadPreset: 'YOUR_PRESET', // Configure in Cloudinary dashboard
    sources: ['local', 'camera'],
    resourceType: 'video',
    maxFileSize: 100000000, // 100MB
  },
  (error, result) => {
    if (result.event === 'success') {
      console.log('Uploaded:', result.info.secure_url);
    }
  }
);
```

**Docs**: https://cloudinary.com/documentation/upload_widget

---

## Alternative: Mux

Better for video-focused apps. Professional-grade.

**Free tier**: 10 videos, 100k delivery minutes
**Strengths**: Adaptive streaming, analytics, thumbnail generation

### Quick Integration

```bash
npm install @mux/mux-node
```

```javascript
// Server-side: Create upload URL
import Mux from '@mux/mux-node';

const mux = new Mux();

const upload = await mux.video.uploads.create({
  new_asset_settings: {
    playback_policy: ['public'],
  },
  cors_origin: 'https://yoursite.com',
});

// Return upload.url to client for direct upload
```

**Docs**: https://docs.mux.com/guides/video/upload-files-directly

---

## Alternative: Uploadcare

Simplest integration. Upload widget does everything.

```html
<script src="https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js"></script>
<input type="hidden" role="uploadcare-uploader" data-public-key="YOUR_KEY" />
```

**Docs**: https://uploadcare.com/docs/uploads/file-uploader/

---

## DO NOT Build From Scratch Unless:

- You have specific compliance requirements
- Budget for video infrastructure is significant
- You have dedicated engineering time
- You understand: transcoding pipelines, adaptive bitrate, CDN configuration

For MVPs and most products, use Cloudinary or Mux.

---

## Questions to Help User Choose

1. **Budget sensitive?** → Cloudinary (generous free tier)
2. **Video-centric product?** → Mux (best video features)
3. **Just need uploads to work?** → Uploadcare (simplest)
4. **Need adaptive streaming?** → Mux (HLS/DASH built-in)
