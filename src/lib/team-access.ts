import crypto from 'crypto';
import { db } from '@/lib/db';
import { invitations, users, agencies } from '@/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getFeatureLimit, type SubscriptionTier } from '@/lib/features';
import { sendTeamInvitationEmail } from '@/lib/email';
import { UserRole, type UserRole as UserRoleType } from '@/lib/permissions';
import { dispatchNotification } from '@/lib/notification-dispatcher';
import { logAuditEvent } from '@/lib/audit';

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: UserRoleType;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  agencyId: string;
  email: string;
  name: string | null;
  role: UserRoleType;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  sentAt: Date;
  acceptedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

// Get team members for an agency
export async function getTeamMembers(agencyId: string): Promise<TeamMember[]> {
  if (!db) return [];

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.agencyId, agencyId));

  return members.map((m: { id: string; email: string; name: string | null; role: string | null; createdAt: Date }) => ({
    ...m,
    role: (m.role as UserRole) || 'producer',
  }));
}

// Count active team members (excluding owner)
// This counts ALL users with roles other than 'owner'
export async function getTeamMemberCount(agencyId: string): Promise<number> {
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.agencyId, agencyId),
        // Count all users except the agency owner
        ne(users.role, 'owner')
      )
    );

  return result[0]?.count || 0;
}

// Get total user count including owner
export async function getTotalUserCount(agencyId: string): Promise<number> {
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.agencyId, agencyId));

  return result[0]?.count || 0;
}

// Check if agency can add more team members
export async function canAddTeamMember(
  agencyId: string
): Promise<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number }> {
  if (!db) {
    return { allowed: false, reason: 'Database not connected' };
  }

  // Get agency tier
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agency) {
    return { allowed: false, reason: 'Agency not found' };
  }

  const tier = agency.subscriptionTier as SubscriptionTier;

  // Get team member limit for tier
  const limit = getFeatureLimit('teamLogins', tier);

  // If feature is disabled (limit is ), no team members allowed
  if (limit === 0) {
    return {
      allowed: false,
      reason: 'Upgrade to Growth Agency ($249/month) to add team members.',
      currentCount: 0,
      limit: 0,
    };
  }

  // If no limit or unlimited, allow
  if (limit === null || limit === Infinity) {
    return { allowed: true };
  }

  // Count current team members (excluding owner)
  const currentCount = await getTeamMemberCount(agencyId);

  if (currentCount >= limit) {
    const tierName = tier === 'growth' ? 'Enterprise' : 'higher tier';
    const price = tier === 'growth' ? '$499' : 'custom';
    return {
      allowed: false,
      reason: `You've reached your team member limit (${currentCount}/${limit}). Upgrade to ${tierName} (${price}/month) to add more.`,
      currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit,
  };
}

// Add team member (called after Better Auth user is created)
export async function addTeamMember(
  agencyId: string,
  userId: string,
  email: string,
  name: string,
  role: UserRoleType = 'producer'
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  // Check if can add
  const canAdd = await canAddTeamMember(agencyId);

  if (!canAdd.allowed) {
    return { success: false, error: canAdd.reason };
  }

  // Get agency tier for producer seat billing
  const agency = await db
    .select({
      subscriptionTier: agencies.subscriptionTier,
      paddleCustomerId: agencies.paddleCustomerId,
    })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agency) {
    return { success: false, error: 'Agency not found' };
  }

  try {
    // Add user to database
    await db.insert(users).values({
      id: userId,
      email,
      name,
      role,
      agencyId,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
      return { success: false, error: 'User already exists' };
    }
    return { success: false, error: 'Failed to add team member' };
  }
}

// Update team member role
export async function updateTeamMemberRole(
  userId: string,
  agencyId: string,
  newRole: UserRoleType
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  // Get current user to verify agency membership
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify user belongs to agency
  if (user.agencyId !== agencyId) {
    return { success: false, error: 'User does not belong to this agency' };
  }

  // Cannot change owner role
  if (user.role === 'owner' || newRole === 'owner') {
    return { success: false, error: 'Cannot modify owner role' };
  }

  // Update role
  await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Log audit event
  await logAuditEvent({
    agencyId,
    userId,
    action: 'user.update',
    resourceType: 'user',
    resourceId: userId,
    details: { previousRole: user.role, newRole },
    status: 'success',
  });

  return { success: true };
}

// Remove team member
export async function removeTeamMember(
  userId: string,
  agencyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  // Can't remove owner
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!user || user.role === 'owner') {
    return { success: false, error: 'Cannot remove agency owner' };
  }

  // Verify user belongs to agency
  if (user.agencyId !== agencyId) {
    return { success: false, error: 'User does not belong to this agency' };
  }

  await db.delete(users).where(eq(users.id, userId));

  // Log audit event
  await logAuditEvent({
    agencyId,
    userId,
    action: 'user.delete',
    resourceType: 'user',
    resourceId: userId,
    details: { role: user.role },
    status: 'success',
  });

  return { success: true };
}

// Get user role for current session
export async function getUserRole(userId: string): Promise<UserRole | null> {
  if (!db) return null;

  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r: any[]) => r[0]);

  return (user?.role as UserRole) || null;
}

// Invitation management functions

// Create invitation
export async function createInvitation(
  agencyId: string,
  email: string,
  name: string,
  role: UserRoleType
): Promise<{ success: boolean; error?: string; invitationId?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  try {
    // Generate unique token
    const token = generateInvitationToken();
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if invitation already exists for this email
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.agencyId, agencyId),
        eq(invitations.email, email),
        eq(invitations.status, 'pending')
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (existingInvitation) {
      return { success: false, error: 'Invitation already sent to this email' };
    }

    // Get agency name for email
    const agency = await db
      .select({ name: agencies.name })
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    // Create invitation
    const result = await db
      .insert(invitations)
      .values({
        agencyId,
        email,
        name,
        role,
        token,
        expiresAt,
      })
      .returning()
      .then((r: any[]) => r[0]);

    // Send invitation email
    if (agency) {
      await sendTeamInvitationEmail({
        id: result.id,
        email,
        name,
        role,
        token,
        agencyName: agency.name,
        expiresAt,
      });

      // Get owner user ID for notification
      const owner = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.agencyId, agencyId),
          eq(users.role, 'owner')
        ))
        .limit(1)
        .then((r: any[]) => r[0]);

      if (owner) {
        // Dispatch unified notification (DB + Push + Email)
        await dispatchNotification(
          agencyId,
          owner.id,
          {
            type: 'team_invitation',
            memberName: name || email,
            memberEmail: email
          }
        );
      }
    }

    return { success: true, invitationId: result.id };
  } catch (error) {
    logger.error('Error creating invitation', error);
    return { success: false, error: 'Failed to create invitation' };
  }
}

// Get pending invitations for agency
export async function getPendingInvitations(agencyId: string): Promise<Invitation[]> {
  if (!db) return [];

  const pendingInvitations = await db
    .select()
    .from(invitations)
    .where(and(
      eq(invitations.agencyId, agencyId),
      eq(invitations.status, 'pending')
    ))
    .orderBy(invitations.createdAt);

  return pendingInvitations as Invitation[];
}

// Accept invitation
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  try {
    // Find invitation
    const invitation = await db
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.token, token),
        eq(invitations.status, 'pending'),
        gt(invitations.expiresAt, new Date()) // Not expired
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!invitation) {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    // Update invitation status
    await db
      .update(invitations)
      .set({
        status: 'accepted',
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitation.id));

    // Get owner user ID for notification
    const owner = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.agencyId, invitation.agencyId),
        eq(users.role, 'owner')
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (owner) {
      // Dispatch unified notification (DB + Push + Email)
      await dispatchNotification(
        invitation.agencyId,
        owner.id,
        {
          type: 'team_member_joined',
          memberName: invitation.name || invitation.email,
          memberRole: invitation.role
        }
      );
    }

    // Add user to agency (this would be handled by webhook in production)
    // For now, we'll create the user record
    await db
      .insert(users)
      .values({
        id: userId,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        agencyId: invitation.agencyId,
      });

    return { success: true };
  } catch (error) {
    logger.error('Error accepting invitation', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

// Cancel invitation
export async function cancelInvitation(
  invitationId: string,
  agencyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  try {
    const result = await db
      .update(invitations)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(invitations.id, invitationId),
        eq(invitations.agencyId, agencyId)
      ));

    return { success: true };
  } catch (error) {
    logger.error('Error cancelling invitation', error);
    return { success: false, error: 'Failed to cancel invitation' };
  }
}

// Resend invitation
export async function resendInvitation(
  invitationId: string,
  agencyId: string
): Promise<{ success: boolean; error?: string; newToken?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  try {
    // Get current invitation
    const currentInvitation = await db
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.id, invitationId),
        eq(invitations.agencyId, agencyId),
        eq(invitations.status, 'pending')
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!currentInvitation) {
      return { success: false, error: 'Invitation not found or already processed' };
    }

    // Generate new token
    const newToken = generateInvitationToken();
    
    // Set new expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invitation
    await db
      .update(invitations)
      .set({
        token: newToken,
        expiresAt,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId));

    // Get agency name for email
    const agency = await db
      .select({ name: agencies.name })
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    // Send new invitation email
    if (agency) {
      await sendTeamInvitationEmail({
        id: currentInvitation.id,
        email: currentInvitation.email,
        name: currentInvitation.name,
        role: currentInvitation.role as UserRole,
        token: newToken,
        agencyName: agency.name,
        expiresAt,
      });
    }

    return { success: true, newToken };
  } catch (error) {
    logger.error('Error resending invitation', error);
    return { success: false, error: 'Failed to resend invitation' };
  }
}

// Clean up expired invitations
export async function cleanupExpiredInvitations(): Promise<void> {
  if (!db) return;

  try {
    await db
      .update(invitations)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(and(
        eq(invitations.status, 'pending'),
        lt(invitations.expiresAt, new Date())
      ));
  } catch (error) {
    logger.error('Error cleaning up expired invitations', error);
  }
}

// Helper function to generate invitation token
// Uses cryptographically secure random bytes from Node.js crypto module
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 character hex string
}
