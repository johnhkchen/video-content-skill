#!/bin/bash
# upload-videos.sh - Upload video files to cloud storage (R2 or S3)
#
# Usage:
#   ./upload-videos.sh r2 <source-dir> <bucket-name> [prefix]
#   ./upload-videos.sh s3 <source-dir> <bucket-name> [prefix]
#
# Examples:
#   ./upload-videos.sh r2 ./public/videos my-video-bucket
#   ./upload-videos.sh s3 ./assets/media my-bucket videos/
#
# Environment variables required:
#   For R2:
#     R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
#   For S3:
#     AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (optional, defaults to us-east-1)

set -e

PROVIDER="$1"
SOURCE_DIR="$2"
BUCKET_NAME="$3"
PREFIX="${4:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 <provider> <source-dir> <bucket-name> [prefix]"
    echo ""
    echo "Providers: r2, s3"
    echo ""
    echo "Examples:"
    echo "  $0 r2 ./public/videos my-video-bucket"
    echo "  $0 s3 ./assets/media my-bucket videos/"
    exit 1
}

# Validate arguments
if [[ -z "$PROVIDER" || -z "$SOURCE_DIR" || -z "$BUCKET_NAME" ]]; then
    show_usage
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
    log_error "Source directory does not exist: $SOURCE_DIR"
    exit 1
fi

# Get content type based on extension
get_content_type() {
    local file="$1"
    case "${file##*.}" in
        mp4) echo "video/mp4" ;;
        webm) echo "video/webm" ;;
        mov) echo "video/quicktime" ;;
        avi) echo "video/x-msvideo" ;;
        mkv) echo "video/x-matroska" ;;
        m4v) echo "video/x-m4v" ;;
        ogv) echo "video/ogg" ;;
        *) echo "application/octet-stream" ;;
    esac
}

# Upload to Cloudflare R2
upload_to_r2() {
    # Check required env vars
    if [[ -z "$R2_ACCOUNT_ID" || -z "$R2_ACCESS_KEY_ID" || -z "$R2_SECRET_ACCESS_KEY" ]]; then
        log_error "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
        exit 1
    fi

    local endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    log_info "Uploading to Cloudflare R2 bucket: $BUCKET_NAME"
    log_info "Endpoint: $endpoint"
    echo ""

    # Find and upload video files
    find "$SOURCE_DIR" -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" -o -name "*.avi" -o -name "*.mkv" -o -name "*.m4v" -o -name "*.ogv" \) | while read -r file; do
        # Get relative path from source dir
        relative_path="${file#$SOURCE_DIR/}"
        object_key="${PREFIX}${relative_path}"
        content_type=$(get_content_type "$file")
        file_size=$(du -h "$file" | cut -f1)

        log_info "Uploading: $relative_path ($file_size)"

        # Use AWS CLI with R2 endpoint (R2 is S3-compatible)
        AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
        aws s3 cp "$file" "s3://${BUCKET_NAME}/${object_key}" \
            --endpoint-url "$endpoint" \
            --content-type "$content_type" \
            --no-progress

        echo "  -> s3://${BUCKET_NAME}/${object_key}"
    done

    echo ""
    log_info "Upload complete!"
    echo ""
    echo "Your videos are available at:"
    echo "  https://${BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/<path>"
    echo ""
    echo "For public access, configure a custom domain in Cloudflare Dashboard:"
    echo "  R2 -> ${BUCKET_NAME} -> Settings -> Public access"
}

# Upload to AWS S3
upload_to_s3() {
    # Check AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Install it first: https://aws.amazon.com/cli/"
        exit 1
    fi

    local region="${AWS_REGION:-us-east-1}"

    log_info "Uploading to AWS S3 bucket: $BUCKET_NAME (region: $region)"
    echo ""

    # Find and upload video files
    find "$SOURCE_DIR" -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" -o -name "*.avi" -o -name "*.mkv" -o -name "*.m4v" -o -name "*.ogv" \) | while read -r file; do
        # Get relative path from source dir
        relative_path="${file#$SOURCE_DIR/}"
        object_key="${PREFIX}${relative_path}"
        content_type=$(get_content_type "$file")
        file_size=$(du -h "$file" | cut -f1)

        log_info "Uploading: $relative_path ($file_size)"

        aws s3 cp "$file" "s3://${BUCKET_NAME}/${object_key}" \
            --content-type "$content_type" \
            --region "$region" \
            --no-progress

        echo "  -> s3://${BUCKET_NAME}/${object_key}"
    done

    echo ""
    log_info "Upload complete!"
    echo ""
    echo "Your videos are available at:"
    echo "  https://${BUCKET_NAME}.s3.${region}.amazonaws.com/<path>"
    echo ""
    echo "For CDN delivery, set up CloudFront distribution pointing to this bucket."
}

# Main
case "$PROVIDER" in
    r2)
        upload_to_r2
        ;;
    s3)
        upload_to_s3
        ;;
    *)
        log_error "Unknown provider: $PROVIDER"
        show_usage
        ;;
esac
