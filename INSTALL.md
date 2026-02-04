# Installing the video-deploy Skill

Different installation methods depending on your Claude product.

---

## Quick Install (Claude Code)

### One-Liner: Install to Current Project
```bash
curl -fsSL https://raw.githubusercontent.com/johnhkchen/video-content-skill/main/install.sh | bash
```

Or if you prefer not to pipe to bash:
```bash
# Clone just the skill folder into your project
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/johnhkchen/video-content-skill.git /tmp/vcs && \
  cd /tmp/vcs && git sparse-checkout set .claude/skills/video-deploy && \
  mkdir -p .claude/skills && cp -r .claude/skills/video-deploy "$OLDPWD/.claude/skills/" && \
  cd "$OLDPWD" && rm -rf /tmp/vcs
```

### One-Liner: Install Globally (All Projects)
```bash
curl -fsSL https://raw.githubusercontent.com/johnhkchen/video-content-skill/main/install.sh | bash -s -- --global
```

### Let Claude Do It
Just tell Claude Code:
> "Install the video-deploy skill from github.com/johnhkchen/video-content-skill"

Claude can run the install command for you.

---

## Manual Install (Claude Code)

Skills are filesystem-based. No zip file needed.

### Option A: Project-Level (Recommended)
Copy to your project's `.claude/skills/` directory:

```bash
# From your project root
mkdir -p .claude/skills
cp -r path/to/video-deploy .claude/skills/
```

The skill will be available when Claude Code runs in that project.

### Option B: Global (All Projects)
Copy to your home directory:

```bash
mkdir -p ~/.claude/skills
cp -r path/to/video-deploy ~/.claude/skills/
```

The skill will be available in all projects.

### Verify Installation
```bash
# Check skill is detected
ls -la .claude/skills/video-deploy/SKILL.md
# or
ls -la ~/.claude/skills/video-deploy/SKILL.md
```

---

## Claude.ai (Web) and Claude Desktop

Requires a ZIP file upload.

### Step 1: Create ZIP
```bash
cd .claude/skills
zip -r video-deploy.zip video-deploy/
```

**Important**: The ZIP should contain the `video-deploy` folder at root level, not nested.

Correct structure:
```
video-deploy.zip
└── video-deploy/
    ├── SKILL.md
    ├── routes/
    ├── reference/
    └── ...
```

### Step 2: Upload
1. Open Claude.ai or Claude Desktop
2. Go to Settings → Capabilities
3. Scroll to "Skills" section
4. Click "Upload skill"
5. Select `video-deploy.zip`

### Step 3: Enable
Ensure "Code execution and file creation" is enabled in Capabilities.

---

## Claude API

For programmatic use with the Claude API.

### Via Skills API
```python
import anthropic

client = anthropic.Anthropic()

# Upload skill
with open("video-deploy.zip", "rb") as f:
    skill = client.skills.create(
        name="video-deploy",
        file=f
    )

# Use in conversation
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    skills=[skill.id],
    messages=[
        {"role": "user", "content": "Help me deploy my app with video files"}
    ]
)
```

### Via filesystem (Agent SDK)
When using the Claude Agent SDK with filesystem access:
```bash
# Skills are loaded from ./skills/ in the agent's working directory
cp -r video-deploy ./skills/
```

---

## Skill Structure

```
video-deploy/
├── SKILL.md           # Main skill instructions (required)
├── routes/            # Detailed guides per scenario
│   ├── emergency.md
│   ├── r2-setup.md
│   ├── transcoding.md
│   ├── user-uploads.md
│   ├── signed-urls.md
│   └── existing-s3.md
├── reference/         # Supporting documentation
│   ├── frameworks.md
│   └── troubleshooting.md
├── scripts/           # Helper scripts (optional)
│   ├── upload-videos.sh
│   ├── upload-videos.mjs
│   └── signed-url.mjs
└── templates/         # Code templates (optional)
    ├── video-config.ts
    ├── react-video-component.tsx
    └── nextjs-api-route.ts
```

---

## Important Notes

### Skills Don't Sync Across Platforms
- Skills uploaded to Claude.ai are NOT available in Claude Code
- Skills in Claude Code are NOT available in Claude.ai
- Each platform requires separate installation

### File Permissions
Ensure scripts are executable:
```bash
chmod +x video-deploy/scripts/*.sh
chmod +x video-deploy/scripts/*.mjs
```

### Updating the Skill
- **Claude Code**: Just overwrite the files
- **Claude.ai**: Delete and re-upload the ZIP
- **API**: Upload new version via skills.update()

---

## Testing the Installation

Ask Claude:
> "I have a web app with video files that I need to deploy. Can you help?"

The skill should activate and begin with discovery questions about:
1. Existing cloud storage
2. Type of videos
3. Access control needs
4. Urgency

If Claude doesn't seem to use the skill, check:
- Skill is in correct directory
- SKILL.md exists and has valid frontmatter
- Code execution is enabled (for Claude.ai)
