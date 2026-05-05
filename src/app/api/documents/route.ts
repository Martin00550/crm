import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';
import { documents, users, agencies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isFeatureEnabled, SubscriptionTier } from '@/lib/features';
import { getUserAgencyId } from '@/actions/data';
import { withApiSecurity } from '@/lib/api-security';
import { z } from 'zod';

// Validation schema for document upload
const documentUploadSchema = z.object({
  policyId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).default('other'),
});

// Initialize Backblaze B2 S3 client
const s3Client = new S3Client({
  region: process.env.B2_REGION || 'us-west-004',
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'retainvault-logos';
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL || `https://${BUCKET_NAME}.s3.us-west-004.backblazeb2.com`;

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get user's agency tier
    const agency = await db
      .select({ tier: agencies.subscriptionTier })
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Check if file uploads are enabled for this tier
    if (!isFeatureEnabled('fileUploads', agency.tier as SubscriptionTier)) {
      return NextResponse.json({ 
        error: 'File uploads not available in your plan',
        upgradeMessage: 'Upgrade to Growth plan to enable file uploads'
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate form fields
    const validationResult = documentUploadSchema.safeParse({
      policyId: formData.get('policyId'),
      clientId: formData.get('clientId'),
      description: formData.get('description'),
      category: formData.get('category') || 'other',
    });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { policyId, clientId, description, category } = validationResult.data;

    if (!file || !agencyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type (PDF, images, common document formats)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `documents/${agencyId}/${policyId || 'general'}/${timestamp}-${file.name}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Backblaze B2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construct public URL (bucket is public)
    const fileUrl = `${B2_PUBLIC_URL}/${uniqueFileName}`;

    // Save document record to database
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const [document] = await db
      .insert(documents)
      .values({
        agencyId,
        policyId: policyId || null,
        clientId: clientId || null,
        uploadedBy: userId,
        fileName: uniqueFileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: uniqueFileName,
        fileUrl,
        description: description || null,
        category,
        isPublic: false,
      })
      .returning();

    return NextResponse.json({ success: true, document });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'upload',
    auditAction: 'document.upload',
  }
);

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId: userAgencyId } = context;

    if (!userAgencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policyId');
    const agencyId = searchParams.get('agencyId');

    if (!policyId) {
      return NextResponse.json({ error: 'Missing policyId' }, { status: 400 });
    }

    // Verify agencyId matches user's agency (ignore if not provided, use user's agency)
    const targetAgencyId = agencyId || userAgencyId;
    if (targetAgencyId !== userAgencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const documentList = await db
      .select()
      .from(documents)
      .where(and(eq(documents.policyId, policyId), eq(documents.agencyId, userAgencyId)))
      .execute();

    return NextResponse.json({ documents: documentList });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'document.list',
  }
);

export const DELETE = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId: userAgencyId } = context;

    if (!userAgencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Get document to retrieve URL and verify ownership
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.agencyId, userAgencyId)))
      .limit(1)
      .execute();

    if (!doc || !doc.fileUrl) {
      return NextResponse.json({ error: 'Document not found or invalid' }, { status: 404 });
    }

    // Extract key from URL (format: https://bucket.s3.region.backblazeb2.com/documents/agencyId/policyId/filename)
    const urlParts = doc.fileUrl.split('/');
    const key = urlParts.slice(3).join('/'); // Get everything after bucket name

    // Delete from Backblaze B2
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    // Delete from database
    await db
      .delete(documents)
      .where(eq(documents.id, documentId))
      .execute();

    return NextResponse.json({ success: true });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'document.delete',
  }
);
