import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users, agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/better-auth';

/**
 * Auth wrapper utilities for Server Actions and API routes
 * Ensures consistent authentication and authorization checks
 */

export interface AuthResult {
  userId: string;
  agencyId: string | null;
  role: string | null;
  email: string | null;
}

export interface AuthError {
  error: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL';
}

/**
 * Get auth - Simple function for API routes that returns userId
 * Drop-in replacement for Clerk's auth() - now uses Better Auth
 */
export async function getAuth(): Promise<{ userId: string | null }> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    return { userId: session?.user?.id || null };
  } catch {
    return { userId: null };
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use in Server Actions that require user context
 */
export async function requireAuth(): Promise<AuthResult> {
  // Get session from better-auth
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    throw new Error('Unauthorized: Please sign in to continue');
  }

  const betterAuthUserId = session.user.id;

  // Get user from database by betterAuthUserId
  const user = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, betterAuthUserId))
    .limit(1)
    .then((r: typeof users.$inferSelect[]) => r[0]);

  if (!user) {
    // User exists in auth but not in our database
    // This can happen if webhook hasn't fired yet
    return {
      userId: betterAuthUserId,
      agencyId: null,
      role: null,
      email: session.user.email || null,
    };
  }

  return {
    userId: betterAuthUserId,
    agencyId: user.agencyId,
    role: user.role,
    email: user.email || session.user.email || null,
  };
}

/**
 * Require authentication with agency membership
 * Use for actions that require an agency context
 */
export async function requireAgencyAuth(): Promise<AuthResult & { agencyId: string }> {
  const authResult = await requireAuth();
  
  if (!authResult.agencyId) {
    throw new Error('Forbidden: You must be part of an agency to perform this action');
  }
  
  return authResult as AuthResult & { agencyId: string };
}

/**
 * Require specific role for an action
 * Use for role-based access control
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<AuthResult> {
  const authResult = await requireAuth();
  
  if (!authResult.role || !allowedRoles.includes(authResult.role)) {
    throw new Error(`Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`);
  }
  
  return authResult;
}

/**
 * Require ownership of a resource
 * Use for actions that modify specific resources
 */
export async function requireOwnership(
  resourceAgencyId: string
): Promise<AuthResult> {
  const authResult = await requireAgencyAuth();
  
  if (authResult.agencyId !== resourceAgencyId) {
    throw new Error('Forbidden: You do not have access to this resource');
  }
  
  return authResult;
}

/**
 * Check if user has feature access
 * Combines auth check with feature flag
 */
export async function requireFeatureAccess(
  featureKey: string
): Promise<AuthResult> {
  const authResult = await requireAgencyAuth();
  
  // Import feature access check
  const { canUseFeature } = await import('@/lib/feature-access');
  
  const access = await canUseFeature(authResult.agencyId, featureKey);
  
  if (!access.allowed) {
    throw new Error(access.reason || 'Feature not available');
  }
  
  return authResult;
}

/**
 * Optional auth - returns null if not authenticated
 * Use for actions that work with or without auth
 */
export async function getOptionalAuth(): Promise<AuthResult | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return null;
    }

    const betterAuthUserId = session.user.id;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.betterAuthUserId, betterAuthUserId))
      .limit(1)
      .then((r: typeof users.$inferSelect[]) => r[0]);

    return {
      userId: betterAuthUserId,
      agencyId: user?.agencyId || null,
      role: user?.role || null,
      email: user?.email || session.user.email || null,
    };
  } catch {
    return null;
  }
}

/**
 * Wrapper for Server Actions with auth and error handling
 * Provides consistent error responses
 */
export const withAuth = <TArgs extends any[], TResult>(
  fn: (auth: AuthResult, ...args: TArgs) => Promise<TResult>
): ((...args: TArgs) => Promise<{ success: true; data: TResult } | { success: false; error: string }>) => {
  return async (...args: TArgs) => {
    try {
      const authResult = await requireAuth();
      const result = await fn(authResult, ...args);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Server action error:', error);
      
      // Map error types to user-friendly messages
      if (error.message?.includes('Unauthorized')) {
        return { success: false, error: 'Please sign in to continue' };
      }
      if (error.message?.includes('Forbidden')) {
        return { success: false, error: 'You do not have permission to perform this action' };
      }
      
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };
}

/**
 * Wrapper for agency-scoped Server Actions
 */
export const withAgencyAuth = <TArgs extends any[], TResult>(
  fn: (auth: AuthResult & { agencyId: string }, ...args: TArgs) => Promise<TResult>
): ((...args: TArgs) => Promise<{ success: true; data: TResult } | { success: false; error: string }>) => {
  return async (...args: TArgs) => {
    try {
      const authResult = await requireAgencyAuth();
      const result = await fn(authResult, ...args);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Server action error:', error);
      
      if (error.message?.includes('Unauthorized')) {
        return { success: false, error: 'Please sign in to continue' };
      }
      if (error.message?.includes('Forbidden')) {
        return { success: false, error: 'You must be part of an agency to perform this action' };
      }
      
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };
}

/**
 * Get user's agency details with subscription info
 */
export async function getAgencyWithSubscription(agencyId: string) {
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);
  
  if (!agency) {
    throw new Error('Agency not found');
  }
  
  return {
    id: agency.id,
    name: agency.name,
    subdomain: agency.subdomain,
    subscriptionTier: agency.subscriptionTier,
    subscriptionStatus: agency.subscriptionStatus,
    branding: agency.branding,
    whiteLabelEnabled: agency.whiteLabelEnabled,
  };
}

/**
 * Verify user has access to specific agency data
 * Use before any database query that accesses agency-scoped data
 */
export const verifyAgencyAccess = (userAgencyId: string | null, targetAgencyId: string): boolean => {
  if (!userAgencyId) return false;
  return userAgencyId === targetAgencyId;
};
