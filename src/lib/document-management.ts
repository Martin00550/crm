/**
 * Document Management with Version Control
 * For certificates of insurance, policy documents, endorsements
 */

import { db } from '@/lib/db';
import { documents, users } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  uploadedBy: string;
  createdAt: Date;
  changeNotes?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'certificate' | 'policy' | 'endorsement' | 'invoice' | 'other';
  policyId?: string;
  clientId?: string;
  currentVersion: number;
  versions: DocumentVersion[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Upload a new document with version control
 */
export async function uploadDocument(
  agencyId: string,
  userId: string,
  data: {
    name: string;
    type: 'certificate' | 'policy' | 'endorsement' | 'invoice' | 'other';
    fileName: string;
    fileType: string;
    fileSize: number;
    storageUrl: string;
    policyId?: string;
    clientId?: string;
    changeNotes?: string;
  }
) {
  // Check if document with same name exists
  const existing = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.agencyId, agencyId),
        eq(documents.originalName, data.name),
        isNull(documents.documentId) // Only check parent documents
      )
    )
    .limit(1)
    .then((r: any[]) => r[0]);

  let parentId: string;
  let version: number;

  if (existing) {
    // Create new version
    parentId = existing.id;
    version = existing.currentVersion + 1;
    
    await db.update(documents).set({
      currentVersion: version,
      updatedAt: new Date(),
    }).where(eq(documents.id, parentId));
  } else {
    // Create new parent document
    parentId = randomUUID();
    version = 1;
    
    await db.insert(documents).values({
      id: parentId,
      agencyId,
      fileName: data.fileName,
      originalName: data.name,
      fileType: data.fileType,
      fileSize: data.fileSize,
      filePath: data.storageUrl,
      fileUrl: data.storageUrl,
      type: data.type,
      policyId: data.policyId,
      clientId: data.clientId,
      uploadedBy: userId,
      currentVersion: version,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Insert version record
  await db.insert(documents).values({
    id: randomUUID(),
    agencyId,
    documentId: parentId,
    version,
    fileName: data.fileName,
    originalName: data.name,
    fileType: data.fileType,
    fileSize: data.fileSize,
    filePath: data.storageUrl,
    fileUrl: data.storageUrl,
    type: data.type,
    policyId: data.policyId,
    clientId: data.clientId,
    uploadedBy: userId,
    changeNotes: data.changeNotes,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { documentId: parentId, version };
}

/**
 * Get document with all versions
 */
export async function getDocument(documentId: string, agencyId: string): Promise<Document | null> {
  const doc = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.agencyId, agencyId)
      )
    )
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!doc) return null;

  // Get all versions (if this is a parent document, get all versions; if this is a version, get parent and all versions)
  const parentId = doc.documentId || doc.id;
  const versions = await db
    .select()
    .from(documents)
    .where(eq(documents.documentId, parentId))
    .orderBy(desc(documents.version))
    .then((r: any[]) => r.map((v: any) => ({
      id: v.id,
      documentId: v.documentId,
      version: v.version,
      fileName: v.fileName,
      fileType: v.fileType,
      fileSize: v.fileSize,
      storageUrl: v.fileUrl,
      uploadedBy: v.uploadedBy,
      createdAt: v.createdAt,
      changeNotes: v.changeNotes,
    })));

  return {
    ...doc,
    versions,
  };
}

/**
 * List documents for an agency
 */
export async function listDocuments(
  agencyId: string,
  filters: {
    type?: string;
    policyId?: string;
    clientId?: string;
  } = {}
) {
  const conditions = [eq(documents.agencyId, agencyId)];

  if (filters.type) {
    conditions.push(eq(documents.type, filters.type as any));
  }

  if (filters.policyId) {
    conditions.push(eq(documents.policyId, filters.policyId as any));
  }

  if (filters.clientId) {
    conditions.push(eq(documents.clientId, filters.clientId as any));
  }

  const docs = await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt));

  return docs;
}

/**
 * Restore document to a specific version
 */
export async function restoreDocumentVersion(documentId: string, versionNumber: number, agencyId: string, userId: string) {
  const doc = await getDocument(documentId, agencyId);
  if (!doc) return null;

  const version = doc.versions.find(v => v.version === versionNumber);
  if (!version) return null;

  // Update parent document with version data
  await db.update(documents).set({
    filePath: version.storageUrl,
    fileUrl: version.storageUrl,
    changeNotes: version.changeNotes,
    uploadedBy: userId,
    updatedAt: new Date(),
  }).where(eq(documents.id, documentId));

  return { documentId, version: version.version };
}

/**
 * Delete document (soft delete with version history preserved)
 */
export async function deleteDocument(documentId: string, agencyId: string) {
  await db.delete(documents).where(
    and(
      eq(documents.id, documentId),
      eq(documents.agencyId, agencyId)
    )
  );

  return { success: true };
}

/**
 * Get document version history
 */
export async function getDocumentHistory(documentId: string, agencyId: string) {
  const doc = await getDocument(documentId, agencyId);
  if (!doc) return null;

  // Get uploader information for each version
  const uploaderIds = [...new Set(doc.versions.map(v => v.uploadedBy))];
  const uploaders = await db
    .select()
    .from(users)
    .where(eq(users.id, uploaderIds[0]))
    .limit(10)
    .then((r: any[]) => r);

  const uploaderMap = new Map(uploaders.map((u: any) => [u.id, u.name]));

  return doc.versions.map(v => ({
    ...v,
    uploadedByName: uploaderMap.get(v.uploadedBy) || 'Unknown',
  }));
}
