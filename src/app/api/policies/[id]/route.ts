import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { policies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withApiSecurity } from '@/lib/api-security';

// DELETE /api/policies/[id] - Delete policy
export const DELETE = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId, params } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { id: policyId } = params;

    // Verify policy belongs to agency
    const existingPolicy = await db
      .select()
      .from(policies)
      .where(and(
        eq(policies.id, policyId),
        eq(policies.agencyId, agencyId)
      ))
      .limit(1)
      .then(r => r[0]);

    if (!existingPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Delete policy
    await db.delete(policies).where(eq(policies.id, policyId));

    return NextResponse.json({
      success: true,
      message: 'Policy deleted successfully',
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'policy.delete',
  }
);

// PUT /api/policies/[id] - Update policy
export const PUT = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId, params } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { id: policyId } = params;
    const updateData = await request.json();

    // Verify policy belongs to agency
    const existingPolicy = await db
      .select()
      .from(policies)
      .where(and(
        eq(policies.id, policyId),
        eq(policies.agencyId, agencyId)
      ))
      .limit(1)
      .then(r => r[0]);

    if (!existingPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Calculate health status based on expiration date
    const expirationDate = new Date(updateData.expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let healthStatus = 'healthy';
    if (daysUntilExpiration < 30) healthStatus = 'at-risk';
    else if (daysUntilExpiration < 60) healthStatus = 'warning';

    const updatedPolicy = await db
      .update(policies)
      .set({
        policyNumber: updateData.policyNumber,
        carrier: updateData.carrier,
        policyType: updateData.policyType,
        premium: updateData.premium,
        effectiveDate: new Date(updateData.effectiveDate),
        expirationDate: new Date(updateData.expirationDate),
        status: updateData.status,
        healthScore: updateData.healthScore,
        healthStatus,
        updatedAt: new Date(),
      })
      .where(eq(policies.id, policyId))
      .returning({
        id: policies.id,
        policyNumber: policies.policyNumber,
        carrier: policies.carrier,
        policyType: policies.policyType,
        premium: policies.premium,
        effectiveDate: policies.effectiveDate,
        expirationDate: policies.expirationDate,
        status: policies.status,
        healthScore: policies.healthScore,
        healthStatus: policies.healthStatus,
      })
      .then((r: any[]) => r[0]);

    return NextResponse.json({
      success: true,
      policy: updatedPolicy,
      message: 'Policy updated successfully',
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'policy.update',
  }
);
