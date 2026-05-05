import { db } from '@/lib/db';
import { agencies, clients, policies, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePortalToken } from '@/lib/auth';
import { getPresignedUrl } from '@/lib/storage';

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

  if (!agency) {
    return null;
  }

  const branding = agency.branding || {};
  let logoUrl = branding.logoUrl;

  // Resolve logo key to full URL if it exists
  if (logoUrl && !logoUrl.startsWith('http')) {
    try {
      logoUrl = await getPresignedUrl(logoUrl);
    } catch (e) {
      console.error('Failed to resolve logo URL:', e);
    }
  }

  return {
    agencyId: agency.id,
    subdomain: agency.subdomain || `${agency.name.toLowerCase().replace(/\s+/g, '-')}`,
    branding: {
      logo: logoUrl,
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

  // 1. Fetch the client to get their name
  const client = await db
    .select({ name: clients.name, subdomain: clients.subdomain })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!client) return null;

  // 2. Generate the permanent portal slug if it doesn't exist
  let permanentSlug = client.subdomain;
  
  if (!permanentSlug) {
    // Clean name: lowercase, remove non-alphanumeric, max 15 chars
    const cleanName = client.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    // Generate 6 random characters
    const randomStr = Math.random().toString(36).substring(2, 8);
    permanentSlug = `${cleanName}-${randomStr}`;

    // Save to database
    await db
      .update(clients)
      .set({
        subdomain: permanentSlug,
        portalAccessEnabled: true,
        portalInviteSent: true,
      })
      .where(and(
        eq(clients.id, clientId),
        eq(clients.agencyId, agencyId)
      ));
  }

  // 3. Return the Permanent Portal URL
  const portalUrl = `https://${permanentSlug}.retainvault.com`;

  return {
    token: permanentSlug, // For backwards compatibility with UI if needed
    expiresAt: null, // Permanent!
    portalUrl,
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
