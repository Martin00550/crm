/**
 * Unified Storage Utility using Backblaze B2
 * Optimized for performance with Cloudflare CDN
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Backblaze B2 configuration with Cloudflare CDN support
const s3Client = new S3Client({
  region: process.env.B2_REGION || 'us-west-004',
  endpoint: process.env.B2_ENDPOINT || `https://s3.us-west-004.backblazeb2.com`,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'policypulse-storage';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.s3.us-west-004.backblazeb2.com`;

export interface StorageConfig {
  bucket?: string;
  path: string;
  contentType: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

/**
 * Upload file to Backblaze B2
 */
export async function uploadFile(
  file: Buffer,
  config: StorageConfig
): Promise<{ url: string; key: string }> {
  const { bucket = BUCKET_NAME, path, contentType, metadata, cacheControl = 'public, max-age=31536000, immutable' } = config;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
    CacheControl: cacheControl,
    Metadata: metadata,
  });

  await s3Client.send(command);

  // Return CDN URL if configured, otherwise direct B2 URL
  const url = `${CDN_URL}/${path}`;

  return { url, key: path };
}

/**
 * Get file from Backblaze B2
 */
export async function getFile(key: string, bucket: string = BUCKET_NAME): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks: Uint8Array[] = [];

  const stream = response.Body as any;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Delete file from Backblaze B2
 */
export async function deleteFile(key: string, bucket: string = BUCKET_NAME): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate storage path with organization
 */
export function generateStoragePath(
  type: 'logos' | 'documents' | 'certificates' | 'avatars' | 'temp' | 'backups',
  entityId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = filename.split('.').pop();
  
  return `${type}/${entityId}/${timestamp}-${randomSuffix}.${extension}`;
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${CDN_URL}/${key}`;
}

/**
 * Storage presets for common use cases
 */
export const storagePresets = {
  logo: {
    contentType: 'image/png',
    cacheControl: 'public, max-age=31536000, immutable',
  },
  document: {
    contentType: 'application/pdf',
    cacheControl: 'public, max-age=86400',
  },
  certificate: {
    contentType: 'application/pdf',
    cacheControl: 'public, max-age=2592000',
  },
  avatar: {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000, immutable',
  },
};
