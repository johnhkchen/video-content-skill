# Emergency Path: Demo in < 24 Hours

Speed over elegance. Get videos working NOW.

## Option 1: YouTube Unlisted (5 minutes)
Fastest. Not elegant, but works immediately.

1. Upload video to YouTube
2. Set visibility to "Unlisted"
3. Get embed code or direct link
4. Replace local video with embed:

```html
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID"
  frameborder="0"
  allowfullscreen>
</iframe>
```

**Pros**: Instant, free, handles any format, auto-transcodes
**Cons**: YouTube branding, less professional for pitches

---

## Option 2: Cloudinary (15 minutes)
Good balance of speed and professionalism.

1. Sign up at cloudinary.com (free tier: 25 credits ≈ 500 min SD video)
2. Go to Media Library → Upload (drag & drop)
3. Click uploaded video → Copy URL
4. Replace local paths:

```javascript
// Before
<video src="/videos/demo.mp4" />

// After
<video src="https://res.cloudinary.com/YOUR_CLOUD/video/upload/v1/demo.mp4" />
```

**Pros**: Professional URLs, auto-optimization, handles .mov files
**Cons**: Limited free tier, another account to manage

---

## Option 3: R2 Quick Setup (30 minutes)
If you already have a Cloudflare account, this is fastest proper solution.

See: `routes/r2-setup.md`

---

## Last Resort Options

If nothing else works:

1. **Compress aggressively**: `ffmpeg -i input.mp4 -crf 35 -preset fast tiny.mp4`
   - Keep in repo if total < 50MB

2. **GitHub Releases**: Upload as release asset, link directly
   - Hacky but works for demos

3. **Loom/Drive links**: Not embedded, but shareable
   - Fine for stakeholder reviews

---

## After the Demo

These are temporary solutions. Once pressure is off:
- Set up proper hosting (see `routes/r2-setup.md`)
- Consider long-term costs and maintenance
- Migrate away from YouTube embed if needed
