import { db } from '@/lib/db';
import { clients, policies, renewals } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { addDays, subDays } from 'date-fns';

const MOCK_CLIENTS = [
  { name: 'Sterling Logistics Corp', email: 'ops@sterlinglogistics.com', phone: '555-0101', industry: 'Transportation' },
  { name: 'Apex Tech Ventures', email: 'finance@apextech.io', phone: '555-0102', industry: 'Technology' },
  { name: 'Riverdale Greenhouses', email: 'admin@riverdale.farm', phone: '555-0103', industry: 'Agriculture' },
  { name: 'Blue Horizon Marine', email: 'operations@bluehorizon.marine', phone: '555-0104', industry: 'Marine' },
  { name: 'Acme Corp', email: 'risk@acmecorp.com', phone: '555-0105', industry: 'Manufacturing' },
  { name: 'TechStart Inc', email: 'ceo@techstart.io', phone: '555-0106', industry: 'Technology' },
  { name: 'Metro Construction', email: 'projects@metrocon.com', phone: '555-0107', industry: 'Construction' },
  { name: 'Downtown Properties LLC', email: 'landlord@downtownprop.com', phone: '555-0108', industry: 'Real Estate' },
];

const MOCK_POLICIES = [
  { carrier: 'Travelers', type: 'Commercial Auto', premium: 42500, daysUntilExpiration: 85 },
  { carrier: 'Chubb', type: 'D&O Liability', premium: 18200, daysUntilExpiration: 28 },
  { carrier: 'The Hartford', type: 'Property & Fire', premium: 15750, daysUntilExpiration: 95 },
  { carrier: 'Liberty Mutual', type: 'Inland Marine', premium: 22100, daysUntilExpiration: 75 },
  { carrier: 'Travelers', type: 'General Liability', premium: 24500, daysUntilExpiration: 65 },
  { carrier: 'State Farm', type: 'Commercial Auto', premium: 12800, daysUntilExpiration: 120 },
  { carrier: 'Progressive', type: 'Workers Compensation', premium: 8900, daysUntilExpiration: 45 },
  { carrier: 'Allstate', type: 'Umbrella', premium: 5500, daysUntilExpiration: 110 },
  { carrier: 'AIG', type: 'Cyber Liability', premium: 15700, daysUntilExpiration: 55 },
  { carrier: 'Nationwide', type: 'Property & Fire', premium: 22300, daysUntilExpiration: 90 },
];

export async function seedMockData(agencyId: string) {
  const now = new Date();
  if (!db) throw new Error('Database not connected');
  const createdClients = [];

  for (const clientData of MOCK_CLIENTS) {
    const [client] = await db.insert(clients)
      .values({
        agencyId,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        industry: clientData.industry,
      })
      .returning();
    createdClients.push(client);
  }

  const createdPolicies = [];
  for (let i = 0; i < MOCK_POLICIES.length; i++) {
    const policyData = MOCK_POLICIES[i];
    const client = createdClients[i % createdClients.length];
    const expirationDate = addDays(now, policyData.daysUntilExpiration);
    const previousPremium = policyData.premium * (1 - Math.random() * 0.15);
    
    const [policy] = await db.insert(policies)
      .values({
        clientId: client.id,
        agencyId,
        policyNumber: `POL-${String(i + 1).padStart(5, '0')}`,
        carrier: policyData.carrier,
        policyType: policyData.type,
        premium: policyData.premium.toString(),
        currentTermPremium: policyData.premium.toString(),
        previousTermPremium: previousPremium.toFixed(2),
        effectiveDate: subDays(expirationDate, 365),
        expirationDate,
        status: 'active',
        healthScore: policyData.daysUntilExpiration <= 30 ? 35 : policyData.daysUntilExpiration <= 60 ? 65 : 85,
        healthStatus: policyData.daysUntilExpiration <= 30 ? 'at-risk' : policyData.daysUntilExpiration <= 60 ? 'warning' : 'healthy',
      })
      .returning();
    createdPolicies.push(policy);

    for (const days of [90, 60, 30]) {
      const renewalDate = addDays(expirationDate, -days);
      if (renewalDate > now) {
        await db.insert(renewals)
          .values({
            policyId: policy.id,
            agencyId,
            renewalDate,
            status: days <= 30 ? 'in-progress' : 'pending',
            notification30Sent: days <= 30,
            notification30SentAt: days <= 30 ? subDays(now, 1) : null,
          })
          .returning();
      }
    }
  }

  return {
    clients: createdClients.length,
    policies: createdPolicies.length,
  };
}

export async function clearMockData(agencyId: string) {
  if (!db) return;
  await db.delete(renewals).where(eq(renewals.agencyId, agencyId));
  await db.delete(policies).where(eq(policies.agencyId, agencyId));
  await db.delete(clients).where(eq(clients.agencyId, agencyId));
}
