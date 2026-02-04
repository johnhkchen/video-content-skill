#!/bin/bash
# install.sh - Install the video-deploy skill for Claude Code
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/OWNER/video-content-skill/main/install.sh | bash
#   curl -fsSL ... | bash -s -- --global    # Install globally
#   curl -fsSL ... | bash -s -- --help      # Show help
#
# Or run directly:
#   ./install.sh           # Install to current project
#   ./install.sh --global  # Install to ~/.claude/skills/

set -e

REPO="johnhkchen/video-content-skill"
BRANCH="main"
SKILL_NAME="video-deploy"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

show_help() {
    cat << EOF
Install the video-deploy skill for Claude Code

Usage:
  ./install.sh [OPTIONS]

Options:
  --global    Install to ~/.claude/skills/ (available in all projects)
  --project   Install to ./.claude/skills/ (default, current project only)
  --help      Show this help message

Examples:
  # Install to current project
  curl -fsSL https://raw.githubusercontent.com/$REPO/$BRANCH/install.sh | bash

  # Install globally
  curl -fsSL https://raw.githubusercontent.com/$REPO/$BRANCH/install.sh | bash -s -- --global

EOF
    exit 0
}

# Parse arguments
INSTALL_DIR=".claude/skills"
GLOBAL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --global)
            INSTALL_DIR="$HOME/.claude/skills"
            GLOBAL=true
            shift
            ;;
        --project)
            INSTALL_DIR=".claude/skills"
            shift
            ;;
        --help|-h)
            show_help
            ;;
        *)
            error "Unknown option: $1. Use --help for usage."
            ;;
    esac
done

# Check for required tools
command -v curl >/dev/null 2>&1 || error "curl is required but not installed"
command -v tar >/dev/null 2>&1 || error "tar is required but not installed"

echo ""
info "Installing $SKILL_NAME skill..."
echo ""

# Create target directory
mkdir -p "$INSTALL_DIR"

# Download and extract
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

info "Downloading from GitHub..."
curl -fsSL "https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz" -o "$TEMP_DIR/skill.tar.gz"

info "Extracting..."
tar -xzf "$TEMP_DIR/skill.tar.gz" -C "$TEMP_DIR"

# Find the extracted directory (name includes branch)
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "video-content-skill-*" | head -1)

if [[ -z "$EXTRACTED_DIR" ]]; then
    error "Failed to extract skill. Archive structure unexpected."
fi

# Copy skill to destination
if [[ -d "$INSTALL_DIR/$SKILL_NAME" ]]; then
    warn "Skill already exists at $INSTALL_DIR/$SKILL_NAME"
    warn "Overwriting..."
    rm -rf "$INSTALL_DIR/$SKILL_NAME"
fi

cp -r "$EXTRACTED_DIR/.claude/skills/$SKILL_NAME" "$INSTALL_DIR/"

# Make scripts executable
chmod +x "$INSTALL_DIR/$SKILL_NAME/scripts/"*.sh 2>/dev/null || true
chmod +x "$INSTALL_DIR/$SKILL_NAME/scripts/"*.mjs 2>/dev/null || true

echo ""
success "Installed $SKILL_NAME to $INSTALL_DIR/$SKILL_NAME"
echo ""

if $GLOBAL; then
    info "Skill is now available globally in all Claude Code sessions."
else
    info "Skill is now available in this project."
    info "Run with --global to install for all projects."
fi

echo ""
info "To test, ask Claude Code:"
echo "  \"I need to deploy my app with video files\""
echo ""
