'use server';

import { db } from '@/lib/db';
import { renewals, policies, clients, commissions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAgencyAuth } from '@/lib/auth-wrapper';
import { Errors } from '@/lib/error-handler';
import { formatCurrency, formatDate } from '@/lib/utils';

export async function getRenewalsList(agencyId: string, status?: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw Errors.server('Database connection failed');
  }
  
  const renewalList = await db
    .select({
      id: renewals.id,
      policyId: renewals.policyId,
      renewalDate: renewals.renewalDate,
      status: renewals.status,
      notification90Sent: renewals.notification90Sent,
      notification60Sent: renewals.notification60Sent,
      notification30Sent: renewals.notification30Sent,
      aiReportGenerated: renewals.aiReportGenerated,
      aiReportSent: renewals.aiReportSent,
      policyNumber: policies.policyNumber,
      policyType: policies.policyType,
      carrier: policies.carrier,
      premium: policies.premium,
      clientName: clients.name,
    })
    .from(renewals)
    .innerJoin(policies, eq(renewals.policyId, policies.id))
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(eq(renewals.agencyId, agencyId))
    .orderBy(renewals.renewalDate)
    .execute();

  return renewalList.map((r) => ({
    ...r,
    premium: formatCurrency(r.premium),
    renewalDate: formatDate(r.renewalDate),
  }));
}

export async function getCommissions(agencyId: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw Errors.server('Database connection failed');
  }

  const commissionList = await db
    .select({
      id: commissions.id,
      policyNumber: policies.policyNumber,
      policyType: policies.policyType,
      totalPremium: commissions.totalPremium,
      commissionRate: commissions.commissionRate,
      commissionAmount: commissions.commissionAmount,
      agentSplit: commissions.agentSplit,
      agentCommission: commissions.agentCommission,
      carrierPayoutStatus: commissions.carrierPayoutStatus,
      period: commissions.period,
      clientName: clients.name,
    })
    .from(commissions)
    .innerJoin(policies, eq(commissions.policyId, policies.id))
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(eq(commissions.agencyId, agencyId))
    .orderBy(desc(commissions.createdAt))
    .limit(50)
    .execute();

  return commissionList.map((c) => ({
    ...c,
    totalPremium: formatCurrency(c.totalPremium),
    commissionAmount: formatCurrency(c.commissionAmount),
    agentCommission: c.agentCommission != null ? formatCurrency(c.agentCommission) : null,
  }));
}
