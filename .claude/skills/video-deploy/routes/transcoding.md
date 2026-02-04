# Transcoding: Converting Video Formats

User has .mov, .avi, .mkv, or other non-web formats.

## Why This Matters

- **.mov** (QuickTime): Safari-only, huge files (10-50x larger than needed)
- **.avi/.mkv**: Limited browser support
- **Web standard**: mp4 (H.264) or webm (VP9)

**Do NOT proceed to hosting until videos are converted.**

---

## Quick Conversion with FFmpeg

### Install FFmpeg
```bash
# Mac
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (use chocolatey or download from ffmpeg.org)
choco install ffmpeg
```

### Convert Single File
```bash
# Good quality, reasonable size (CRF 23 = visually lossless)
ffmpeg -i input.mov -c:v libx264 -crf 23 -c:a aac -b:a 128k output.mp4

# Smaller file, slightly lower quality (CRF 28)
ffmpeg -i input.mov -c:v libx264 -crf 28 -c:a aac -b:a 96k output.mp4

# Web-optimized (fast start for streaming)
ffmpeg -i input.mov -c:v libx264 -crf 23 -c:a aac -movflags +faststart output.mp4
```

### Batch Convert All .mov Files
```bash
for f in *.mov; do
  ffmpeg -i "$f" -c:v libx264 -crf 23 -c:a aac -movflags +faststart "${f%.mov}.mp4"
done
```

---

## Alternative: Let Cloudinary Transcode

If user doesn't want to install ffmpeg:

1. Upload .mov directly to Cloudinary (free tier handles this)
2. Request .mp4 in URL: `https://res.cloudinary.com/xxx/video/upload/f_mp4/video.mov`
3. Cloudinary transcodes automatically

This is slower but requires no local tools.

---

## Compression Guidelines

| Content Type | Recommended CRF | Notes |
|--------------|-----------------|-------|
| Screen recording | 23-26 | Text needs clarity |
| Marketing video | 20-23 | Quality matters |
| Background/hero | 28-32 | Size matters more |
| Demo with UI | 23-25 | Balance |

Lower CRF = higher quality, larger file.

---

## After Conversion

1. Verify videos play in browser (Chrome, Firefox, Safari)
2. Check file sizes are reasonable
3. Proceed to hosting setup (see appropriate route)
