'use server';

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Security Monitoring Utilities
 * Detects and alerts on suspicious activity patterns
 */

export interface SecurityAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
}

// Thresholds for triggering alerts
const THRESHOLDS = {
  failedLogins: 5, // Per 15 minutes
  apiAbuse: 100, // Requests per minute
  unusualAccess: 3, // New locations per day
  bulkExport: 1000, // Records exported at once
  permissionEscalation: 1, // Any attempt
};

/**
 * Monitor failed login attempts
 */
export async function monitorFailedLogins(userId: string): Promise<SecurityAlert | null> {
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE user_id = ${userId}
      AND action = 'auth.login'
      AND status = 'failure'
      AND created_at > NOW() - INTERVAL '15 minutes'
  `);

  const failureCount = (result.rows[0] as any)?.count || 0;

  if (failureCount >= THRESHOLDS.failedLogins) {
    return {
      type: 'brute_force_attempt',
      severity: 'critical',
      message: `Multiple failed login attempts detected: ${failureCount} in last 15 minutes`,
      details: { userId, failureCount },
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Monitor API abuse patterns
 */
export async function monitorApiAbuse(identifier: string): Promise<SecurityAlert | null> {
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE (user_id = ${identifier} OR ip_address = ${identifier})
      AND action LIKE 'api.%'
      AND created_at > NOW() - INTERVAL '1 minute'
  `);

  const requestCount = (result.rows[0] as any)?.count || 0;

  if (requestCount >= THRESHOLDS.apiAbuse) {
    return {
      type: 'api_abuse',
      severity: 'warning',
      message: `High API request rate detected: ${requestCount} in last minute`,
      details: { identifier, requestCount },
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Monitor unusual access patterns (new locations/devices)
 */
export async function monitorUnusualAccess(
  userId: string,
  currentIp: string,
  currentUserAgent: string
): Promise<SecurityAlert | null> {
  if (!db) return null;

  // Get distinct locations in last 30 days
  const result = await db.execute(sql`
    SELECT DISTINCT ip_address, user_agent
    FROM audit_logs
    WHERE user_id = ${userId}
      AND action = 'auth.login'
      AND status = 'success'
      AND created_at > NOW() - INTERVAL '30 days'
  `);

  const knownIPs = new Set(
    result.rows.map((r: any) => r.ip_address).filter(Boolean)
  );

  // Check if current IP is new
  if (!knownIPs.has(currentIp)) {
    // Count how many new locations today
    const todayNewLocations = await db.execute(sql`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM audit_logs
      WHERE user_id = ${userId}
        AND action = 'auth.login'
        AND status = 'success'
        AND ip_address NOT IN (
          SELECT DISTINCT ip_address
          FROM audit_logs
          WHERE user_id = ${userId}
            AND action = 'auth.login'
            AND created_at < NOW() - INTERVAL '1 day'
        )
        AND created_at > NOW() - INTERVAL '1 day'
    `);

    const newLocationCount = (todayNewLocations.rows[0] as any)?.count || 0;

    if (newLocationCount >= THRESHOLDS.unusualAccess) {
      return {
        type: 'unusual_access_pattern',
        severity: 'warning',
        message: 'Multiple new access locations detected',
        details: { userId, newIp: currentIp, userAgent: currentUserAgent, newLocationCount },
        timestamp: new Date(),
      };
    }
  }

  return null;
}

/**
 * Monitor bulk data exports
 */
export async function monitorBulkExport(
  userId: string,
  agencyId: string,
  recordCount: number
): Promise<SecurityAlert | null> {
  if (recordCount >= THRESHOLDS.bulkExport) {
    return {
      type: 'bulk_data_export',
      severity: 'warning',
      message: `Large data export detected: ${recordCount} records`,
      details: { userId, agencyId, recordCount },
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Monitor permission escalation attempts
 */
export async function monitorPermissionEscalation(
  userId: string,
  attemptedRole: string,
  currentRole: string
): Promise<SecurityAlert | null> {
  const roleHierarchy = ['staff', 'producer', 'admin', 'owner'];
  
  const currentIndex = roleHierarchy.indexOf(currentRole);
  const attemptedIndex = roleHierarchy.indexOf(attemptedRole);
  
  if (attemptedIndex > currentIndex) {
    return {
      type: 'permission_escalation_attempt',
      severity: 'critical',
      message: `User attempted to escalate permissions from ${currentRole} to ${attemptedRole}`,
      details: { userId, currentRole, attemptedRole },
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Run all security monitors and return alerts
 */
export async function runSecurityMonitors(
  context: {
    userId?: string;
    agencyId?: string;
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    recordCount?: number;
  }
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];

  if (context.userId) {
    const loginAlert = await monitorFailedLogins(context.userId);
    if (loginAlert) alerts.push(loginAlert);

    if (context.ipAddress && context.userAgent) {
      const accessAlert = await monitorUnusualAccess(
        context.userId,
        context.ipAddress,
        context.userAgent
      );
      if (accessAlert) alerts.push(accessAlert);
    }
  }

  if (context.ipAddress) {
    const abuseAlert = await monitorApiAbuse(context.ipAddress);
    if (abuseAlert) alerts.push(abuseAlert);
  }

  if (context.userId && context.agencyId && context.recordCount) {
    const exportAlert = await monitorBulkExport(
      context.userId,
      context.agencyId,
      context.recordCount
    );
    if (exportAlert) alerts.push(exportAlert);
  }

  // Log all alerts
  for (const alert of alerts) {
    logger.warn('SECURITY ALERT', alert);
    
    // Store in database
    await storeSecurityAlert(alert, context);
  }

  return alerts;
}

/**
 * Store security alert in database
 */
async function storeSecurityAlert(
  alert: SecurityAlert,
  context: { userId?: string; agencyId?: string }
): Promise<void> {
  if (!db) return;

  try {
    await db.execute(sql`
      INSERT INTO security_alerts (type, severity, user_id, agency_id, message, details)
      VALUES (${alert.type}, ${alert.severity}, ${context.userId || null}, ${context.agencyId || null}, ${alert.message}, ${JSON.stringify(alert.details)})
    `);
  } catch (error) {
    logger.error('Failed to store security alert', error);
  }
}

/**
 * Get security dashboard stats
 */
export async function getSecurityStats(agencyId: string): Promise<{
  totalAlerts: number;
  criticalAlerts: number;
  unresolvedAlerts: number;
  recentActivity: number;
}> {
  if (!db) {
    return { totalAlerts: 0, criticalAlerts: 0, unresolvedAlerts: 0, recentActivity: 0 };
  }

  const stats = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM security_alerts WHERE agency_id = ${agencyId}) as total_alerts,
      (SELECT COUNT(*) FROM security_alerts WHERE agency_id = ${agencyId} AND severity = 'critical') as critical_alerts,
      (SELECT COUNT(*) FROM security_alerts WHERE agency_id = ${agencyId} AND resolved = FALSE) as unresolved_alerts,
      (SELECT COUNT(*) FROM audit_logs WHERE agency_id = ${agencyId} AND created_at > NOW() - INTERVAL '24 hours') as recent_activity
  `);

  const row = stats.rows[0] as any;

  return {
    totalAlerts: parseInt(row?.total_alerts || '0'),
    criticalAlerts: parseInt(row?.critical_alerts || '0'),
    unresolvedAlerts: parseInt(row?.unresolved_alerts || '0'),
    recentActivity: parseInt(row?.recent_activity || '0'),
  };
}
