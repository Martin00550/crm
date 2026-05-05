import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId, params } = context;
    const { id: clientId } = params;

    // Verify client belongs to agency
    const client = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(
        eq(clients.id, clientId),
        eq(clients.agencyId, agencyId)
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get client's policies
    const clientPolicies = await db
      .select({
        id: policies.id,
        policyNumber: policies.policyNumber,
        carrier: policies.carrier,
        policyType: policies.policyType,
        premium: policies.premium,
        currentTermPremium: policies.currentTermPremium,
        previousTermPremium: policies.previousTermPremium,
        effectiveDate: policies.effectiveDate,
        expirationDate: policies.expirationDate,
        status: policies.status,
        healthScore: policies.healthScore,
        healthStatus: policies.healthStatus,
        notes: policies.notes,
        createdAt: policies.createdAt,
      })
      .from(policies)
      .where(and(
        eq(policies.clientId, clientId),
        eq(policies.agencyId, agencyId)
      ))
      .orderBy(policies.expirationDate);

    return NextResponse.json({
      success: true,
      policies: clientPolicies,
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'client.policies.view',
  }
);
