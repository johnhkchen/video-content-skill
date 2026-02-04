# Troubleshooting

Common issues and fixes.

## CORS Errors

**Symptom**: Console shows `Access to video blocked by CORS policy`

**Causes**:
1. CORS not configured on bucket
2. Wrong domain in AllowedOrigins
3. Missing headers in request

**Fix**:
- Check bucket CORS settings
- Ensure your domain (including protocol) is listed
- For development, temporarily use `["*"]`

---

## 403 Forbidden

**Symptom**: Video URL returns 403

**Causes**:
1. Bucket not public (if should be)
2. Signed URL expired
3. Wrong bucket/key

**Fix**:
- Verify public access is enabled
- Generate new signed URL
- Check the exact path in bucket

---

## Videos Load Slowly

**Causes**:
1. No CDN (using direct bucket URL)
2. Videos not compressed
3. Serving 4K to mobile

**Fix**:
- Use custom domain (enables CDN)
- Compress with ffmpeg: `ffmpeg -i in.mp4 -crf 28 out.mp4`
- Consider adaptive bitrate for long videos

---

## Build Fails with Large Files

**Symptom**: Vercel/Netlify build timeout or size error

**Cause**: Videos included in function bundle or build

**Fix** (Next.js):
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      type: 'asset/resource',
    });
    return config;
  },
};
```

Or: move videos out of `src/`, keep only in `public/`

---

## Video Plays Audio Only (Black Screen)

**Cause**: Wrong codec or container

**Fix**: Re-encode to H.264:
```bash
ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mp4
```

---

## Upload Hangs or Times Out

**Cause**: Large file without multipart upload

**Fix**:
- For files > 100MB, ensure multipart is used
- AWS CLI handles this automatically
- Check network stability

---

## "Video Cannot Be Played" on Safari

**Cause**: Video uses codec Safari doesn't support

**Fix**: Ensure H.264 video codec + AAC audio:
```bash
ffmpeg -i input.mp4 -c:v libx264 -c:a aac -strict -2 safari-compatible.mp4
```

---

## Environment Variable Not Working

**Symptoms**: Video still loads from `/videos` in production

**Check**:
1. Correct prefix for framework? (`NEXT_PUBLIC_`, `VITE_`, etc.)
2. Variable set in deployment platform?
3. Rebuilt after setting variable?
4. Accessing correctly? (`process.env` vs `import.meta.env`)

See `reference/frameworks.md` for correct patterns.
