#!/usr/bin/env node
/**
 * upload-videos.mjs - Upload video files to cloud storage (R2 or S3)
 *
 * Usage:
 *   node upload-videos.mjs r2 <source-dir> <bucket-name> [--prefix=<prefix>] [--dry-run]
 *   node upload-videos.mjs s3 <source-dir> <bucket-name> [--prefix=<prefix>] [--dry-run]
 *
 * Environment variables:
 *   For R2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   For S3: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile, readdir, stat } from 'fs/promises';
import { join, relative, extname } from 'path';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv']);

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/x-m4v',
  '.ogv': 'video/ogg',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        yield* walkDir(fullPath);
      }
    } else if (VIDEO_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      yield fullPath;
    }
  }
}

async function uploadToStorage(provider, sourceDir, bucketName, options = {}) {
  const { prefix = '', dryRun = false } = options;

  let client;
  let baseUrl;

  if (provider === 'r2') {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    }

    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    baseUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
  } else if (provider === 's3') {
    const region = process.env.AWS_REGION || 'us-east-1';

    client = new S3Client({ region });
    baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  console.log(`\n📦 Uploading to ${provider.toUpperCase()}: ${bucketName}`);
  console.log(`📁 Source: ${sourceDir}`);
  if (prefix) console.log(`🏷️  Prefix: ${prefix}`);
  if (dryRun) console.log(`🔍 DRY RUN - no files will be uploaded\n`);
  console.log('');

  const uploaded = [];
  let totalSize = 0;

  for await (const filePath of walkDir(sourceDir)) {
    const relativePath = relative(sourceDir, filePath);
    const objectKey = prefix + relativePath;
    const ext = extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;
    totalSize += fileSize;

    console.log(`  📤 ${relativePath} (${formatBytes(fileSize)})`);

    if (!dryRun) {
      const fileContent = await readFile(filePath);

      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: fileContent,
          ContentType: contentType,
        })
      );
    }

    uploaded.push({
      local: relativePath,
      remote: objectKey,
      url: `${baseUrl}/${objectKey}`,
      size: fileSize,
    });
  }

  console.log('');
  console.log(`✅ ${dryRun ? 'Would upload' : 'Uploaded'} ${uploaded.length} files (${formatBytes(totalSize)})`);
  console.log('');

  // Output URL mapping
  console.log('📋 URL Mapping:');
  console.log('─'.repeat(60));
  for (const file of uploaded) {
    console.log(`  ${file.local}`);
    console.log(`  → ${file.url}`);
    console.log('');
  }

  return uploaded;
}

// Parse CLI arguments
const args = process.argv.slice(2);
const provider = args[0];
const sourceDir = args[1];
const bucketName = args[2];

const options = {
  prefix: '',
  dryRun: false,
};

for (const arg of args.slice(3)) {
  if (arg.startsWith('--prefix=')) {
    options.prefix = arg.slice(9);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
}

if (!provider || !sourceDir || !bucketName) {
  console.log(`
Usage: node upload-videos.mjs <provider> <source-dir> <bucket-name> [options]

Providers: r2, s3

Options:
  --prefix=<prefix>  Add prefix to all object keys
  --dry-run          Show what would be uploaded without uploading

Examples:
  node upload-videos.mjs r2 ./public/videos my-bucket
  node upload-videos.mjs s3 ./assets/media my-bucket --prefix=videos/
  node upload-videos.mjs r2 ./public my-bucket --dry-run
  `);
  process.exit(1);
}

uploadToStorage(provider, sourceDir, bucketName, options).catch((err) => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});
