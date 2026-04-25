'use server';

import { db } from '@/lib/db';
import { auditLogs, securityAlerts } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Audit logging for security-sensitive operations
 * Tracks who did what, when, and from where
 */

export type AuditAction = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.mfa_enable'
  | 'auth.mfa_disable'
  | 'auth.password_change'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'agency.create'
  | 'agency.update'
  | 'agency.delete'
  | 'policy.create'
  | 'policy.update'
  | 'policy.delete'
  | 'client.create'
  | 'client.update'
  | 'client.delete'
  | 'file.upload'
  | 'file.delete'
  | 'payment.create'
  | 'payment.refund'
  | 'subscription.create'
  | 'subscription.cancel'
  | 'settings.update'
  | 'team.invite'
  | 'team.remove'
  | 'api_key.create'
  | 'api_key.revoke'
  | 'security.alert';

export interface AuditLogEntry {
  agencyId?: string;
  userId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Insert audit log entry using Drizzle
    await db?.insert(auditLogs).values({
      agencyId: entry.agencyId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      details: entry.details,
      status: entry.status,
      errorMessage: entry.errorMessage,
    });

    // Check for suspicious patterns
    await checkSuspiciousActivity(entry);
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Audit logging failed:', error);
  }
}

/**
 * Check for suspicious activity patterns
 */
async function checkSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
  // Alert on multiple failed actions
  if (entry.status === 'failure' && entry.userId) {
    const recentFailures = await db?.execute(sql`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE user_id = ${entry.userId}
        AND status = 'failure'
        AND created_at > NOW() - INTERVAL '15 minutes'
    `);

    const failureCount = (recentFailures?.rows[0] as any)?.count || 0;
    
    if (failureCount >= 5) {
      await logSecurityAlert({
        type: 'multiple_failures',
        severity: 'warning',
        userId: entry.userId,
        message: `Multiple failed actions detected: ${failureCount} in last 15 minutes`,
        details: { action: entry.action },
      });
    }
  }

  // Alert on new device/location (simplified check)
  if (entry.action === 'auth.login' && entry.status === 'success' && entry.userId) {
    const knownDevices = await db?.execute(sql`
      SELECT DISTINCT user_agent, ip_address
      FROM audit_logs
      WHERE user_id = ${entry.userId}
        AND action = 'auth.login'
        AND status = 'success'
        AND created_at > NOW() - INTERVAL '30 days'
    `);

    const knownIPs = new Set(
      knownDevices?.rows.map((r: any) => r.ip_address).filter(Boolean)
    );

    if (entry.ipAddress && !knownIPs.has(entry.ipAddress)) {
      await logSecurityAlert({
        type: 'new_location',
        severity: 'info',
        userId: entry.userId,
        message: 'Login from new location detected',
        details: { ipAddress: entry.ipAddress, userAgent: entry.userAgent },
      });
    }
  }
}

/**
 * Log a security alert
 */
export async function logSecurityAlert(alert: {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  userId?: string;
  agencyId?: string;
  message: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    // Insert security alert using Drizzle
    await db?.insert(securityAlerts).values({
      type: alert.type,
      severity: alert.severity,
      userId: alert.userId,
      agencyId: alert.agencyId,
      message: alert.message,
      details: alert.details,
    });

    // Log critical alerts immediately
    if (alert.severity === 'critical') {
      console.error('SECURITY ALERT:', alert);
    }
  } catch (error) {
    console.error('Security alert logging failed:', error);
  }
}

/**
 * Get audit logs for an agency
 */
export async function getAuditLogs(
  agencyId: string,
  options?: {
    userId?: string;
    action?: AuditAction;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<any[]> {
  if (!db) return [];

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  let query = sql`
    SELECT * FROM audit_logs
    WHERE agency_id = ${agencyId}
  `;

  if (options?.userId) {
    query = sql`${query} AND user_id = ${options.userId}`;
  }
  if (options?.action) {
    query = sql`${query} AND action = ${options.action}`;
  }
  if (options?.startDate) {
    query = sql`${query} AND created_at >= ${options.startDate}`;
  }
  if (options?.endDate) {
    query = sql`${query} AND created_at <= ${options.endDate}`;
  }

  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const result = await db.execute(query);
  return result.rows;
}

/**
 * Get security alerts for an agency
 */
export async function getSecurityAlerts(
  agencyId: string,
  options?: {
    severity?: 'info' | 'warning' | 'critical';
    resolved?: boolean;
    limit?: number;
  }
): Promise<any[]> {
  if (!db) return [];

  const limit = options?.limit || 50;

  let query = sql`
    SELECT * FROM security_alerts
    WHERE agency_id = ${agencyId}
  `;

  if (options?.severity) {
    query = sql`${query} AND severity = ${options.severity}`;
  }
  if (options?.resolved !== undefined) {
    query = sql`${query} AND resolved = ${options.resolved}`;
  }

  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;

  const result = await db.execute(query);
  return result.rows;
}

/**
 * Resolve a security alert
 */
export async function resolveSecurityAlert(
  alertId: string,
  resolvedBy: string
): Promise<void> {
  if (!db) return;

  await db.execute(sql`
    UPDATE security_alerts
    SET resolved = TRUE, resolved_at = NOW(), resolved_by = ${resolvedBy}
    WHERE id = ${alertId}
  `);
}

/**
 * Extract request metadata for audit logging
 */
export async function extractRequestMetadata(request: Request): Promise<{
  ipAddress?: string;
  userAgent?: string;
}> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  return {
    ipAddress: forwarded?.split(',')[0]?.trim() || realIp || undefined,
    userAgent: userAgent || undefined,
  };
}
