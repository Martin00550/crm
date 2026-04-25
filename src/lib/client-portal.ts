import { db } from '@/lib/db';
import { agencies, clients, policies, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePortalToken } from '@/lib/auth';

export interface PortalConfig {
  agencyId: string;
  subdomain: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
    supportEmail: string;
    supportPhone?: string;
  };
  settings: {
    allowDocumentDownloads: boolean;
    allowPolicyDetails: boolean;
    allowRenewalRequests: boolean;
    requireTwoFactor: boolean;
  };
}

export async function getPortalConfig(agencyId: string): Promise<PortalConfig | null> {
  if (!db) return null;

  const agency = await db
    .select({
      id: agencies.id,
      name: agencies.name,
      whiteLabelEnabled: agencies.whiteLabelEnabled,
      subdomain: agencies.subdomain,
      branding: agencies.branding,
    })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agency || !agency.whiteLabelEnabled) {
    return null;
  }

  const branding = agency.branding || {};

  return {
    agencyId: agency.id,
    subdomain: agency.subdomain || `${agency.name.toLowerCase().replace(/\s+/g, '-')}`,
    branding: {
      logo: branding.logoUrl,
      primaryColor: branding.primaryColor || '#3b82f6',
      secondaryColor: branding.secondaryColor || '#10b981',
      companyName: agency.name,
      supportEmail: branding.email || 'support@agency.com',
      supportPhone: branding.phone,
    },
    settings: {
      allowDocumentDownloads: true,
      allowPolicyDetails: true,
      allowRenewalRequests: true,
      requireTwoFactor: false,
    },
  };
}

export async function getClientPortalData(clientId: string, agencyId: string) {
  if (!db) return null;

  const client = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      address: clients.address,
      portalAccessEnabled: clients.portalAccessEnabled,
      portalInviteSent: clients.portalInviteSent,
    })
    .from(clients)
    .where(and(
      eq(clients.id, clientId),
      eq(clients.agencyId, agencyId),
      eq(clients.portalAccessEnabled, true)
    ))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!client) {
    return null;
  }

  // Get client's policies
  const clientPolicies = await db
    .select({
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
    .from(policies)
    .where(and(
      eq(policies.clientId, clientId),
      eq(policies.agencyId, agencyId),
      eq(policies.status, 'active')
    ))
    .orderBy(policies.expirationDate);

  return {
    client,
    policies: clientPolicies,
  };
}

export async function generateClientPortalInvite(clientId: string, agencyId: string) {
  if (!db) return null;

  // Generate portal token
  const token = generatePortalToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // Update client with portal access
  await db
    .update(clients)
    .set({
      portalAccessEnabled: true,
      portalInviteSent: true,
      portalToken: token,
      portalTokenExpires: expiresAt,
    })
    .where(and(
      eq(clients.id, clientId),
      eq(clients.agencyId, agencyId)
    ));

  return {
    token,
    expiresAt,
    portalUrl: `https://${(await getPortalConfig(agencyId))?.subdomain}.policypulse.app/invite/${token}`,
  };
}

export async function validatePortalToken(token: string): Promise<{ clientId: string; agencyId: string } | null> {
  if (!db) return null;

  const client = await db
    .select({
      id: clients.id,
      agencyId: clients.agencyId,
      portalToken: clients.portalToken,
      portalTokenExpires: clients.portalTokenExpires,
    })
    .from(clients)
    .where(and(
      eq(clients.portalToken, token),
      eq(clients.portalAccessEnabled, true)
    ))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!client || !client.portalTokenExpires || new Date() > client.portalTokenExpires) {
    return null;
  }

  return {
    clientId: client.id,
    agencyId: client.agencyId,
  };
}

export async function updatePortalConfig(agencyId: string, config: Partial<PortalConfig>) {
  if (!db) return false;

  await db
    .update(agencies)
    .set({
      whiteLabelEnabled: true,
      subdomain: config.subdomain,
      branding: {
        logoUrl: config.branding?.logo,
        primaryColor: config.branding?.primaryColor,
        secondaryColor: config.branding?.secondaryColor,
        email: config.branding?.supportEmail,
        phone: config.branding?.supportPhone,
      },
      updatedAt: new Date(),
    })
    .where(eq(agencies.id, agencyId));

  return true;
}
