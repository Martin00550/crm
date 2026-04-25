import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeFilename, validateUUID, validateMagicBytes } from '@/lib/validation';

import { uploadFile, generateStoragePath, storagePresets } from '@/lib/storage';

// Allowed MIME types with their extensions
const ALLOWED_FILE_TYPES: Record<string, { ext: string[]; maxSize: number }> = {
  'image/png': { ext: ['png'], maxSize: 2 * 1024 * 1024 },
  'image/jpeg': { ext: ['jpg', 'jpeg'], maxSize: 2 * 1024 * 1024 },
  'image/svg+xml': { ext: ['svg'], maxSize: 512 * 1024 }, // Smaller for SVG
  'image/webp': { ext: ['webp'], maxSize: 2 * 1024 * 1024 },
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit by user
    const rateLimit = await checkRateLimit(userId, 'upload');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.', retryAfter: rateLimit.retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          }
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agencyId = formData.get('agencyId') as string;

    if (!file || !agencyId) {
      return NextResponse.json({ error: 'Missing file or agencyId' }, { status: 400 });
    }

    // Validate agency ID format
    if (!validateUUID(agencyId)) {
      return NextResponse.json({ error: 'Invalid agency ID format' }, { status: 400 });
    }

    // Validate file type
    const allowedConfig = ALLOWED_FILE_TYPES[file.type];
    if (!allowedConfig) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PNG, JPG, SVG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > allowedConfig.maxSize) {
      const maxSizeMB = (allowedConfig.maxSize / (1024 * 1024)).toFixed(1);
      return NextResponse.json({ 
        error: `File too large. Maximum size for ${file.type} is ${maxSizeMB}MB.` 
      }, { status: 400 });
    }

    // Validate file extension matches content type
    const originalExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedConfig.ext.includes(originalExt)) {
      return NextResponse.json({ 
        error: 'File extension does not match file type.' 
      }, { status: 400 });
    }

    // Validate file name doesn't contain malicious patterns
    const sanitizedName = sanitizeFilename(file.name);
    if (sanitizedName !== file.name && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Invalid characters in filename.' 
      }, { status: 400 });
    }

    // Generate unique filename with sanitized name
    const extension = originalExt;
    const storagePath = generateStoragePath('logos', agencyId, sanitizedName);

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Additional validation: Check file magic bytes to verify actual file type
    const magicBytes = buffer.subarray(0, 4);
    const isValidMagicBytes = validateMagicBytes(magicBytes, file.type);
    if (!isValidMagicBytes) {
      return NextResponse.json({ 
        error: 'File content does not match declared type.' 
      }, { status: 400 });
    }

    // Upload to Backblaze B2 via unified storage utility
    const { url } = await uploadFile(buffer, {
      ...storagePresets.logo,
      path: storagePath,
      metadata: {
        'original-filename': sanitizedName.substring(0, 100),
        'uploaded-by': userId.substring(0, 50),
        'agency-id': agencyId,
      },
    });

    const publicUrl = url;

    // Log upload for audit trail
    console.log('File uploaded:', {
      userId,
      agencyId,
      storagePath,
      originalName: sanitizedName,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      url: publicUrl,
      success: true,
      filename: sanitizedName,
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    // Don't expose internal error details
    return NextResponse.json({ 
      error: 'Upload failed. Please try again.' 
    }, { status: 500 });
  }
}
