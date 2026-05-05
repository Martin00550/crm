import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { policies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { randomUUID } from 'crypto';
import { validateRequestBody, withApiSecurity } from '@/lib/api-security';
import { createPolicySchema } from '@/lib/validation-schemas';
import { z } from 'zod';

// POST /api/policies - Create new policy
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Validate request body
    const validation = await validateRequestBody(request, createPolicySchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const policyData = validation.data as z.infer<typeof createPolicySchema>;

    // Calculate health status based on expiration date
    const expirationDate = new Date(policyData.expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let healthStatus = 'healthy';
    if (daysUntilExpiration < 30) healthStatus = 'at-risk';
    else if (daysUntilExpiration < 60) healthStatus = 'warning';

    const newPolicy = await db
      .insert(policies)
      .values({
        id: randomUUID(),
        agencyId: agencyId,
        clientId: policyData.clientId,
        policyNumber: policyData.policyNumber,
        carrier: policyData.carrier,
        policyType: policyData.policyType,
        premium: String(policyData.premium),
        effectiveDate: new Date(policyData.effectiveDate),
        expirationDate: new Date(policyData.expirationDate),
        status: policyData.status || 'active',
        healthScore: 80,
        healthStatus,
      })
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
      policy: newPolicy,
      message: 'Policy created successfully',
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'policy.create',
  }
);
