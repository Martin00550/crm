import { db } from '@/lib/db';
import { clients, policies, renewals, agencies, users, notifications } from '@/db/schema';
import { eq, and, gte, lte, desc, asc, ilike, or, count, sql } from 'drizzle-orm';

export interface AgencyContext {
  agencyName: string;
  subscriptionTier: string;
  totalClients: number;
  activePolicies: number;
  totalPremium: number;
  totalCommission: number;
  upcomingRenewals30: number;
  upcomingRenewals60: number;
  upcomingRenewals90: number;
  atRiskPolicies: number;
  recentNotifications: Array<{ title: string; message: string; type: string }>;
  topClients: Array<{ name: string; premium: number; policyCount: number }>;
  carriers: Array<{ name: string; policyCount: number; totalPremium: number }>;
}

export async function buildAgencyContext(userId: string): Promise<AgencyContext | null> {
  if (!db) return null;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user?.agencyId) return null;

    const agencyId = user.agencyId;

    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, agencyId),
    });

    const allClients = await db.query.clients.findMany({
      where: eq(clients.agencyId, agencyId),
    });

    const allPolicies = await db.query.policies.findMany({
      where: eq(policies.agencyId, agencyId),
    });

    const today = new Date();
    const d30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const d90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const renewals30 = allPolicies.filter((p: any) => {
      const exp = new Date(p.expirationDate);
      return exp >= today && exp <= d30 && p.status === 'active';
    });

    const renewals60 = allPolicies.filter((p: any) => {
      const exp = new Date(p.expirationDate);
      return exp > d30 && exp <= d60 && p.status === 'active';
    });

    const renewals90 = allPolicies.filter((p: any) => {
      const exp = new Date(p.expirationDate);
      return exp > d60 && exp <= d90 && p.status === 'active';
    });

    const atRisk = allPolicies.filter((p: any) => p.healthStatus === 'at-risk' && p.status === 'active');

    const clientPremiums = allClients.map((c: any) => {
      const clientPolicies = allPolicies.filter((p: any) => p.clientId === c.id);
      const premium = clientPolicies.reduce((sum: number, p: any) => sum + parseFloat(p.premium || '0'), 0);
      return { name: c.name, premium, policyCount: clientPolicies.length };
    }).sort((a: any, b: any) => b.premium - a.premium).slice(0, 5);

    const carrierMap = new Map<string, { policyCount: number; totalPremium: number }>();
    allPolicies.forEach((p: any) => {
      const existing = carrierMap.get(p.carrier) || { policyCount: 0, totalPremium: 0 };
      existing.policyCount++;
      existing.totalPremium += parseFloat(p.premium || '0');
      carrierMap.set(p.carrier, existing);
    });
    const carriers = Array.from(carrierMap.entries()).map(([name, data]) => ({ name, ...data }));

    const recentNotifs = await db.query.notifications.findMany({
      where: eq(notifications.agencyId, agencyId),
      orderBy: [desc(notifications.createdAt)],
      limit: 5,
    });

    const totalPremium = allPolicies.reduce((sum: number, p: any) => sum + parseFloat(p.premium || '0'), 0);

    return {
      agencyName: agency?.name || 'Unknown Agency',
      subscriptionTier: agency?.subscriptionTier || 'solo',
      totalClients: allClients.length,
      activePolicies: allPolicies.filter((p: any) => p.status === 'active').length,
      totalPremium,
      totalCommission: totalPremium * 0.15,
      upcomingRenewals30: renewals30.length,
      upcomingRenewals60: renewals60.length,
      upcomingRenewals90: renewals90.length,
      atRiskPolicies: atRisk.length,
      recentNotifications: recentNotifs.map((n: any) => ({ title: n.title, message: n.message, type: n.type })),
      topClients: clientPremiums,
      carriers,
    };
  } catch (error) {
    console.error('Failed to build agency context:', error);
    return null;
  }
}
