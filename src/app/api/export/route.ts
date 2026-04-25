import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { policies, clients, agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withApiSecurity } from '@/lib/api-security';
import { isFeatureEnabled, SubscriptionTier } from '@/lib/features';

// GET /api/export - Export data to CSV (requires manage_policies permission)
export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId: authAgencyId } = context;

    if (!authAgencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId') || authAgencyId;
    const dataType = searchParams.get('dataType') || 'all';

    if (!agencyId) {
      return NextResponse.json({ error: 'Missing agencyId' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Get agency tier
    const agency = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Check if csv export is enabled for this tier
    if (!isFeatureEnabled('csvExport', agency.subscriptionTier as SubscriptionTier)) {
      return NextResponse.json({ 
        error: 'CSV Export not available in your plan',
        upgradeMessage: 'Upgrade to access CSV export functionality'
      }, { status: 403 });
    }

    let csvContent = '';
    let filename = '';

    if (dataType === 'clients' || dataType === 'all') {
      // Fetch clients
      const clientsList = await db
        .select()
        .from(clients)
        .where(eq(clients.agencyId, agencyId))
        .execute();

      if (dataType === 'clients') {
        csvContent = generateClientsCSV(clientsList);
        filename = `clients-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        // For 'all', fetch policies with client data
        const policiesList = await db
          .select({
            policy: policies,
            client: clients,
          })
          .from(policies)
          .innerJoin(clients, eq(policies.clientId, clients.id))
          .where(eq(policies.agencyId, agencyId))
          .execute();

        csvContent = generateCombinedCSV(policiesList);
        filename = `policies-clients-${new Date().toISOString().split('T')[0]}.csv`;
      }
    } else if (dataType === 'policies') {
      // Fetch policies with client data
      const policiesList = await db
        .select({
          policy: policies,
          client: clients,
        })
        .from(policies)
        .innerJoin(clients, eq(policies.clientId, clients.id))
        .where(eq(policies.agencyId, agencyId))
        .execute();

      csvContent = generatePoliciesCSV(policiesList);
      filename = `policies-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    requiredPermission: 'manage_policies',
    rateLimit: 'api',
    auditAction: 'export.csv',
  }
);

function generateClientsCSV(clientsList: any[]): string {
  const headers = [
    'Client Name',
    'Email',
    'Phone',
    'Industry',
    'Total Premium',
    'Total Policies',
    'Created At',
  ];

  const rows = clientsList.map((client) => [
    escapeCSV(client.name || ''),
    escapeCSV(client.email || ''),
    escapeCSV(client.phone || ''),
    escapeCSV(client.industry || ''),
    client.totalPremium || '0',
    client.totalPolicies || '0',
    client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}

function generatePoliciesCSV(policiesList: any[]): string {
  const headers = [
    'Client Name',
    'Client Email',
    'Client Phone',
    'Policy Number',
    'Carrier',
    'Policy Type',
    'Premium',
    'Effective Date',
    'Expiration Date',
    'Status',
    'Health Score',
    'Health Status',
  ];

  const rows = policiesList.map(({ policy, client }) => [
    escapeCSV(client.name || ''),
    escapeCSV(client.email || ''),
    escapeCSV(client.phone || ''),
    escapeCSV(policy.policyNumber || ''),
    escapeCSV(policy.carrier || ''),
    escapeCSV(policy.policyType || ''),
    policy.premium || '0',
    policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : '',
    policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : '',
    escapeCSV(policy.status || ''),
    policy.healthScore?.toString() || '',
    escapeCSV(policy.healthStatus || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}

function generateCombinedCSV(policiesList: any[]): string {
  // Same as policies CSV but with more client detail
  const headers = [
    'Client Name',
    'Client Email',
    'Client Phone',
    'Client Industry',
    'Policy Number',
    'Carrier',
    'Policy Type',
    'Premium',
    'Current Term Premium',
    'Previous Term Premium',
    'Effective Date',
    'Expiration Date',
    'Status',
    'Health Score',
    'Health Status',
  ];

  const rows = policiesList.map(({ policy, client }) => [
    escapeCSV(client.name || ''),
    escapeCSV(client.email || ''),
    escapeCSV(client.phone || ''),
    escapeCSV(client.industry || ''),
    escapeCSV(policy.policyNumber || ''),
    escapeCSV(policy.carrier || ''),
    escapeCSV(policy.policyType || ''),
    policy.premium || '0',
    policy.currentTermPremium || '',
    policy.previousTermPremium || '',
    policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : '',
    policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : '',
    escapeCSV(policy.status || ''),
    policy.healthScore?.toString() || '',
    escapeCSV(policy.healthStatus || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}

function escapeCSV(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
