# video-deploy

A Claude Code skill for deploying web apps with video content.

## Quick Install

```bash
# Install to current project
curl -fsSL https://raw.githubusercontent.com/johnhkchen/video-content-skill/main/install.sh | bash

# Install globally (all projects)
curl -fsSL https://raw.githubusercontent.com/johnhkchen/video-content-skill/main/install.sh | bash -s -- --global
```

Or just tell Claude Code:
> "Install the video-deploy skill from github.com/johnhkchen/video-content-skill"

## What It Does

When you need to deploy a web app with video files, this skill helps Claude:

1. **Research your codebase** - Find video files, detect framework, check existing cloud config
2. **Ask the right questions** - Video type? Access control? Urgency?
3. **Route to the right solution**:
   - Emergency (demo tomorrow) → YouTube unlisted or Cloudinary
   - Screen recordings (.mov) → Transcode first
   - User uploads → Cloudinary/Mux (not simple hosting)
   - Standard case → Cloudflare R2 setup
   - Private videos → Signed URLs
   - Already have S3 → Help you use it

## Usage

Ask Claude Code:
- "I need to deploy my app but the videos aren't working"
- "My hackathon project has video files, help me deploy it"
- "How do I host videos for production?"

## Why This Skill?

| Problem | Reality |
|---------|---------|
| Vercel function limit | 4.5MB - videos won't work through functions |
| Netlify Large Media | Not suitable for video streaming |
| S3 egress costs | ~$0.09/GB - expensive for video |
| .mov files | Don't play in most browsers |

This skill knows about these issues and routes you to the right solution.

## Structure

```
.claude/skills/video-deploy/
├── SKILL.md           # Main router
├── routes/            # Detailed guides per scenario
├── reference/         # Framework docs, troubleshooting
├── scripts/           # Upload helpers
└── templates/         # Code patterns
```

## License

MIT
