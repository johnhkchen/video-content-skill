---
name: video-deploy
description: Help deploy web apps with video content. Routes to appropriate solution based on video type, access needs, and urgency. Use when user mentions video deployment issues.
---

# Video Deployment Skill

## WHAT
Help users get video content working in deployed web applications.

## WHY
- Vercel: 4.5MB function limit, recommends external storage
- Netlify: Large Media not suitable for video streaming
- Egress costs: S3 charges ~$0.09/GB, kills budgets for video
- Format issues: .mov files need transcoding for web

## HOW
1. **Research the codebase first** (see below)
2. Ask discovery questions (some may be answered by research)
3. Route to appropriate solution
4. Read detailed guide from `routes/` directory
5. Execute with user

---

## Step 0: Research the Codebase

Before asking questions, gather context. Run these searches:

### Find video files
```bash
find . -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" -o -name "*.avi" \) -not -path "./node_modules/*" 2>/dev/null
```

### Find video references in code
```bash
rg -l '\.(mp4|webm|mov)' --type-add 'web:*.{js,jsx,ts,tsx,vue,svelte,html}' -t web 2>/dev/null
```

### Detect framework (check package.json)
Look for: next, vite, react-scripts, @sveltejs/kit, nuxt, astro

### Check for existing cloud config
```bash
rg -l 'S3Client|r2|cloudinary|BUCKET|CDN_URL' 2>/dev/null
```

### Check deployment platform
Look for: vercel.json, netlify.toml, fly.toml, railway.json, render.yaml

**Use this context to pre-answer questions.** For example:
- Found .mov files? → Will need transcoding route
- Found S3Client in code? → They have existing S3
- Found `NEXT_PUBLIC_` vars? → It's Next.js

---

## Discovery: Ask Before Recommending

### Q1: Existing Infrastructure
> "Do you already have cloud storage (AWS S3, Cloudflare R2, etc.)?"

- **Yes, S3** → Read `routes/existing-s3.md`
- **Yes, R2** → Skip setup, help with upload/code migration
- **No** → Continue to Q2

### Q2: Video Type
> "What kind of videos?"

| Answer | Action |
|--------|--------|
| Static (demos, marketing) | Continue to Q3 |
| Screen recordings (.mov) | Read `routes/transcoding.md` first |
| User uploads in app | Read `routes/user-uploads.md` (different problem) |
| Live streaming | This needs Mux/Cloudflare Stream (out of scope) |

### Q3: Access Control
> "Who should view these?"

| Answer | Route |
|--------|-------|
| Anyone (public) | Standard hosting |
| Logged-in users | Read `routes/signed-urls.md` |
| Paying customers | Discuss DRM needs, likely Mux |
| Just internal team | Quick options: Loom, Drive, unlisted YouTube |

### Q4: Urgency
> "What's your timeline?"

| Answer | Route |
|--------|-------|
| Demo in <24h | Read `routes/emergency.md` |
| Launching soon | Read `routes/r2-setup.md` |
| Planning ahead | Full evaluation of options |

---

## Route Summary

| Route | File | When |
|-------|------|------|
| Emergency | `routes/emergency.md` | Demo tomorrow, need speed |
| Transcoding | `routes/transcoding.md` | .mov or non-web formats |
| User Uploads | `routes/user-uploads.md` | Users submit videos |
| R2 Setup | `routes/r2-setup.md` | Managed hosting (Cloudflare) |
| Self-Host | `routes/self-host.md` | Own the stack (VPS, MinIO, Ceph) |
| Signed URLs | `routes/signed-urls.md` | Private/authenticated videos |
| Existing S3 | `routes/existing-s3.md` | Already have AWS |

Reference files in `reference/`:
- `frameworks.md` - Env var patterns per framework
- `troubleshooting.md` - Common issues

---

## Quick Decision Tree

```
Has existing cloud storage?
├─ Yes → Use it (routes/existing-s3.md or help with their setup)
└─ No → What kind of videos?
         ├─ .mov files → Transcode first (routes/transcoding.md)
         ├─ User uploads → Cloudinary/Mux (routes/user-uploads.md)
         └─ Static videos → Who can view?
                           ├─ Anyone → How urgent?
                           │          ├─ <24h → routes/emergency.md
                           │          └─ Normal → Prefer managed or self-host?
                           │                     ├─ Managed → routes/r2-setup.md
                           │                     └─ Self-host → routes/self-host.md
                           └─ Private → routes/signed-urls.md
```

---

## When NOT to Use This Skill

- **YouTube embed questions** - Already solved, just help with embed code
- **Video player library choice** - Different problem (video.js, plyr, etc.)
- **Playback bugs** - Audio sync, controls, autoplay - not hosting issues
- **Live streaming** - Needs Mux, Cloudflare Stream, Agora - specialized

---

## Choosing a Provider

Don't blindly recommend R2. Ask about their situation first.

### Quick Comparison

| Provider | Egress | Free Tier | Best For |
|----------|--------|-----------|----------|
| **Cloudflare R2** | $0 | 10GB storage | Unknown scale, cost-sensitive |
| **Backblaze B2 + CF** | $0 (via alliance) | 10GB storage | Already using Backblaze |
| **Bunny CDN** | ~$0.01/GB | Pay-as-you-go | Simple pricing, good perf |
| **DigitalOcean Spaces** | $0.01/GB | $5/mo includes 250GB | Already on DO |
| **Vercel Blob** | $0.15/GB | 1GB | Vercel users, simplest DX |
| **Cloudinary** | Included | 25 credits | Need transcoding, transforms |
| **AWS S3 + CloudFront** | ~$0.085/GB | 5GB (12mo) | Already in AWS ecosystem |

### When R2 is Right
- No existing cloud preference
- Scale is uncertain (could spike)
- Cost sensitivity is high
- Want S3-compatible API

### When R2 is Wrong
- **Already on AWS/GCP/Azure** → Ecosystem friction isn't worth it
- **Want simplest setup** → Cloudinary is drag-and-drop
- **Need transcoding** → Cloudinary/Mux do it automatically
- **On Vercel** → Vercel Blob has tighter integration
- **Tiny scale, known** → Just use what you have

### The Honest Trade-offs

**R2 downsides:**
- Requires Cloudflare account (another vendor)
- Dashboard UX not as polished as AWS
- Custom domain requires domain on Cloudflare
- Less tooling ecosystem than S3

**Why we still often recommend it:**
- Zero egress is genuinely valuable for video
- Free tier is generous (10GB)
- S3-compatible = existing tools work
- Good enough for 90% of cases

**But present alternatives when:**
- User seems hesitant about new accounts
- User mentions existing cloud provider
- User prioritizes simplicity over cost
- User needs features R2 doesn't have (transcoding, etc.)

---

## Key Recommendations

**Default for new setup**: Cloudflare R2
- Zero egress (critical for video)
- 10GB free tier
- S3-compatible
- *But ask if they'd prefer alternatives*

**For user uploads**: Cloudinary or Mux
- Don't recommend raw R2/S3 for this

**For emergencies**: YouTube unlisted or Cloudinary
- Speed over elegance

**If they have AWS**: Use S3, suggest CloudFront
- Don't push migration unless cost is a problem

**If they want simple**: Cloudinary
- Higher cost but zero config
