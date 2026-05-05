import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { getAuth } from '@/lib/auth-wrapper';
import { logger } from '@/lib/logger';

// Sample data for seeding
const SAMPLE_CLIENTS = [
  { name: "Acme Manufacturing", industry: "Manufacturing", email: "contact@acmemfg.com", phone: "555-0101" },
  { name: "TechStart Solutions", industry: "Technology", email: "info@techstart.io", phone: "555-0102" },
  { name: "Green Valley Farms", industry: "Agriculture", email: "admin@greenvalleyfarms.com", phone: "555-0103" },
  { name: "Metro Construction", industry: "Construction", email: "safety@metroconstruct.com", phone: "555-0104" },
  { name: "Harbor Healthcare", industry: "Healthcare", email: "compliance@harborhealth.com", phone: "555-0105" },
  { name: "Summit Retail Group", industry: "Retail", email: "ops@summitretail.com", phone: "555-0106" },
  { name: "Pacific Logistics", industry: "Transportation", email: "dispatch@pacificlog.com", phone: "555-0107" },
  { name: "Riverside Restaurant Group", industry: "Hospitality", email: "gm@riversiderest.com", phone: "555-0108" },
  { name: "Pinnacle Financial", industry: "Finance", email: "risk@pinnaclefin.com", phone: "555-0109" },
  { name: "Coastal Real Estate", industry: "Real Estate", email: "leasing@coastalre.com", phone: "555-0110" },
];

const CARRIERS = ["Travelers", "Chubb", "The Hartford", "Liberty Mutual", "CNA", "Zurich", "AIG", "Berkshire Hathaway"];
const POLICY_TYPES = ["General Liability", "Property", "Workers Comp", "Commercial Auto", "Professional Liability", "Cyber", "Umbrella", "BOP"];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agencyId } = await request.json();
    if (!agencyId) {
      return NextResponse.json({ error: 'Missing agencyId' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Create clients first
    const createdClients = [];
    for (const clientData of SAMPLE_CLIENTS) {
      const [client] = await db
        .insert(clients)
        .values({
          agencyId,
          name: clientData.name,
          industry: clientData.industry,
          email: clientData.email,
          phone: clientData.phone,
        })
        .returning();
      createdClients.push(client);
    }

    // Create 50 policies spread across clients
    const now = new Date();
    const policiesData = [];

    for (let i = 0; i < 50; i++) {
      const client = createdClients[i % createdClients.length];
      const carrier = randomFromArray(CARRIERS);
      const policyType = randomFromArray(POLICY_TYPES);
      const premium = randomInt(5000, 150000);
      const effectiveDate = randomDate(new Date(now.getFullYear() - 1, 0, 1), now);
      const expirationDate = new Date(effectiveDate);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      // Calculate days until renewal
      const daysUntilRenewal = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Assign health status based on days until renewal
      let healthStatus = 'healthy';
      let healthScore = randomInt(70, 100);
      if (daysUntilRenewal <= 30) {
        healthStatus = 'at-risk';
        healthScore = randomInt(20, 40);
      } else if (daysUntilRenewal <= 60) {
        healthStatus = 'warning';
        healthScore = randomInt(40, 70);
      }

      policiesData.push({
        clientId: client.id,
        agencyId,
        policyNumber: `${carrier.substring(0, 3).toUpperCase()}-${randomInt(100000, 999999)}`,
        carrier,
        policyType,
        premium: premium.toString(),
        effectiveDate,
        expirationDate,
        status: 'active',
        healthStatus,
        healthScore,
      });
    }

    // Insert all policies
    await db.insert(policies).values(policiesData);

    return NextResponse.json({
      success: true,
      clientsCreated: createdClients.length,
      policiesCreated: policiesData.length,
    });
  } catch (error) {
    logger.error('Seed sample data error', error);
    return NextResponse.json({ error: 'Failed to seed sample data' }, { status: 500 });
  }
}
