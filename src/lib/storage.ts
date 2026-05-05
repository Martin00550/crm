import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Backblaze B2 configuration
const rawEndpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const formattedEndpoint = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`;

const s3Client = new S3Client({
  region: process.env.B2_REGION || 'us-east-005',
  endpoint: formattedEndpoint,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'bookguard-vault';

export interface StorageConfig {
  bucket?: string;
  path: string;
  contentType: string;
  visibility: 'public' | 'private';
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
  const { 
    bucket = BUCKET_NAME, 
    path, 
    contentType, 
    visibility,
    metadata, 
    cacheControl = 'public, max-age=31536000, immutable' 
  } = config;

  // We still use prefixes for organization, but everything is now private at the B2 level
  const finalPath = visibility === 'public' ? `public/${path}` : `private/${path}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: finalPath,
    Body: file,
    ContentType: contentType,
    CacheControl: cacheControl,
    Metadata: metadata,
  });

  await s3Client.send(command);

  // We return the KEY, not a public URL, because we'll sign it later
  return { url: finalPath, key: finalPath };
}

/**
 * Generate a secure, time-limited Signed URL for a file
 */
export async function getPresignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // Generate a URL that expires in the specified time (default 1 hour)
  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
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
 * Storage presets for common use cases
 */
export const storagePresets = {
  logo: {
    contentType: 'image/png',
    visibility: 'public' as const,
    cacheControl: 'public, max-age=31536000, immutable',
  },
  document: {
    contentType: 'application/pdf',
    visibility: 'private' as const,
    cacheControl: 'private, no-cache',
  },
  certificate: {
    contentType: 'application/pdf',
    visibility: 'private' as const,
    cacheControl: 'private, no-cache',
  },
  avatar: {
    contentType: 'image/jpeg',
    visibility: 'public' as const,
    cacheControl: 'public, max-age=31536000, immutable',
  },
};

