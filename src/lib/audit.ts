import { db } from './db';
import { auditLogs } from '@/db/schema';
import { logger } from './logger';

export interface AuditLogParams {
  agencyId?: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  status?: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Records an institutional-grade audit event.
 * This is critical for compliance and transparency in high-ticket insurance management.
 */
export async function recordAuditLog(params: AuditLogParams) {
  if (!db) {
    logger.warn('Audit log skipped: Database not initialized', { action: params.action });
    return;
  }

  try {
    await db.insert(auditLogs).values({
      agencyId: params.agencyId,
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.details,
      status: params.status || 'success',
      errorMessage: params.errorMessage,
    });
  } catch (error) {
    // We log the error but don't throw, to prevent audit failures from breaking the app
    logger.error('Failed to record audit log', { error, params });
  }
}

/**
 * Specific helper for portal access logging
 */
export async function logPortalAccess(subdomain: string, clientId: string, agencyId: string, ip?: string, userAgent?: string) {
  return recordAuditLog({
    agencyId,
    action: 'PORTAL_ACCESS',
    resourceType: 'client_portal',
    resourceId: clientId,
    ipAddress: ip,
    userAgent: userAgent,
    details: { subdomain },
  });
}
import { type NextRequest } from 'next/server';

/**
 * Extracts security metadata from a request.
 */
export async function extractRequestMetadata(request: NextRequest | Request) {
  const headers = request.headers;
  
  // Try to get IP from standard headers
  const ipAddress = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    headers.get('x-real-ip') || 
                    'unknown';
                    
  const userAgent = headers.get('user-agent') || 'unknown';
  
  return {
    ipAddress,
    userAgent,
  };
}
