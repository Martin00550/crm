import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { policies, clients, agencies } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { validateRequestBody, withApiSecurity } from '@/lib/api-security';
import { canUseFeature } from '@/lib/feature-access';
import { sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';

interface CSVRow {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientIndustry?: string;
  policyNumber?: string;
  carrier?: string;
  policyType?: string;
  premium?: string;
  effectiveDate?: string;
  expirationDate?: string;
  status?: string;
}

import Papa from 'papaparse';

function parseCSV(csvText: string): CSVRow[] {
  // Strip BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  
  const result = Papa.parse(cleanText, {
    header: true,
    skipEmptyLines: 'greedy',
    // Remove all non-alphanumeric chars for ultra-robust mapping
    transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
  });

  if (result.errors.length > 0) {
    console.error('PapaParse errors:', result.errors);
  }

  const columnMap: Record<string, string> = {
    'clientname': 'clientName',
    'name': 'clientName',
    'insured': 'clientName',
    'clientemail': 'clientEmail',
    'email': 'clientEmail',
    'clientphone': 'clientPhone',
    'phone': 'clientPhone',
    'industry': 'clientIndustry',
    'policynumber': 'policyNumber',
    'policyno': 'policyNumber',
    'carrier': 'carrier',
    'insurancecompany': 'carrier',
    'policytype': 'policyType',
    'coveragetype': 'policyType',
    'premium': 'premium',
    'annualpremium': 'premium',
    'effectivedate': 'effectiveDate',
    'startdate': 'effectiveDate',
    'expirationdate': 'expirationDate',
    'renewaldate': 'expirationDate',
    'expdate': 'expirationDate',
    'enddate': 'expirationDate',
    'status': 'status',
    'policystatus': 'status',
  };

  const rows: CSVRow[] = [];
  
  (result.data as Array<Record<string, unknown>>).forEach((item, index) => {
    const row: CSVRow = {};
    
    Object.keys(item).forEach((header) => {
      const mappedField = columnMap[header] || header;
      if (item[header]) {
        row[mappedField as keyof CSVRow] = String(item[header]).trim();
      }
    });

    // Handle missing policy number - make it unique using the index
    if (!row.policyNumber && row.clientName) {
      const hash = Math.abs(row.clientName.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));
      row.policyNumber = `T-${hash.toString(16).toUpperCase().substring(0, 6)}-${(index + 1).toString().padStart(3, '0')}`;
    }

    if (row.clientName || row.policyNumber) {
      rows.push(row);
    }
  });

  return rows;
}

function validateRow(row: CSVRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.clientName) {
    errors.push('Missing client name');
  }
  if (!row.policyNumber) {
    errors.push('Missing policy number');
  }
  if (!row.carrier) {
    errors.push('Missing carrier');
  }
  if (!row.policyType) {
    errors.push('Missing policy type');
  }
  if (!row.premium || isNaN(parseFloat(row.premium.replace(/[$,]/g, '')))) {
    errors.push('Invalid premium amount');
  }
  if (!row.expirationDate) {
    errors.push('Missing expiration date (or renewal date)');
  }

  return { valid: errors.length === 0, errors };
}

// POST /api/import - Import policies from CSV (requires manage_policies permission)
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId: authAgencyId } = context;

    if (!authAgencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agencyId = formData.get('agencyId') as string || authAgencyId;

    if (!file || !agencyId) {
      return NextResponse.json({ error: 'Missing file or agencyId' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Parse CSV
    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data rows found in CSV' }, { status: 400 });
    }

    // Validate all rows
    const validationResults = rows.map(row => ({
      row,
      validation: validateRow(row),
    }));

    const validRows = validationResults.filter(r => r.validation.valid);
    const invalidRows = validationResults.filter(r => !r.validation.valid);

    if (validRows.length === 0) {
      return NextResponse.json({
        error: 'No valid rows to import',
        invalidRows: invalidRows.map(r => ({
          clientName: r.row.clientName,
          errors: r.validation.errors,
        })),
      }, { status: 400 });
    }

    // Check policy limit before import
    const policyAccess = await canUseFeature(agencyId, 'policies');
    if (!policyAccess.allowed) {
      return NextResponse.json({ 
        error: policyAccess.reason || 'Policy limit reached',
        limit: policyAccess.limit,
        current: policyAccess.currentUsage,
      }, { status: 403 });
    }

    // Get current policy count
    const currentPolicyCount = await db
      .select({ count: count() })
      .from(policies)
      .where(eq(policies.agencyId, agencyId))
      .then(r => r[0]?.count || 0);

    // Check if import would exceed limit
    if (policyAccess.limit && currentPolicyCount + validRows.length > policyAccess.limit) {
      return NextResponse.json({ 
        error: `Import would exceed your policy limit of ${policyAccess.limit}. You currently have ${currentPolicyCount} policies and are trying to import ${validRows.length} more.`,
        limit: policyAccess.limit,
        current: currentPolicyCount,
        attempting: validRows.length,
      }, { status: 403 });
    }

    // Process imports atomically using a database transaction
    // This ensures all-or-nothing behavior - no partial imports
    try {
      return await db.transaction(async (tx) => {
        // Get existing clients to avoid duplicates
        const existingClients = await tx
          .select()
          .from(clients)
          .where(eq(clients.agencyId, agencyId));

        type Client = typeof clients.$inferSelect;
        const existingClientMap = new Map<string, Client>(existingClients.map((c: Client) => [c.name.toLowerCase(), c]));
        const clientsToCreate: Map<string, { id: string; agencyId: string; name: string; email: string | null; phone: string | null; industry: string | null; subdomain: string }> = new Map();
        const policiesToCreate: { id: string; clientId: string; agencyId: string; policyNumber: string; carrier: string; policyType: string; premium: string; effectiveDate: Date; expirationDate: Date; status: string; healthStatus: string; healthScore: number; _clientName: string }[] = [];

        // First pass: determine which clients need creation and collect all policies
        for (const { row } of validRows) {
          const clientNameLower = row.clientName!.toLowerCase();
          let clientId: string;

          if (existingClientMap.has(clientNameLower)) {
            clientId = existingClientMap.get(clientNameLower)!.id;
          } else if (clientsToCreate.has(clientNameLower)) {
            clientId = clientsToCreate.get(clientNameLower)!.id;
          } else {
            // Create new client with sanitized inputs
            clientId = crypto.randomUUID();
            clientsToCreate.set(clientNameLower, {
              id: clientId,
              agencyId,
              name: sanitizeString(row.clientName!).substring(0, 255),
              email: row.clientEmail ? sanitizeString(row.clientEmail).substring(0, 255) : null,
              phone: row.clientPhone ? sanitizeString(row.clientPhone).substring(0, 50) : null,
              industry: row.clientIndustry ? sanitizeString(row.clientIndustry).substring(0, 100) : null,
              subdomain: sanitizeString(row.clientName!).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 63),
            });
          }

          const rawStatus = row.status?.toLowerCase() || 'active';
          const healthStatus = ['critical', 'at risk', 'review'].includes(rawStatus) ? rawStatus : 'healthy';
          const healthScore = rawStatus === 'critical' ? 25 : rawStatus === 'at risk' ? 50 : rawStatus === 'review' ? 75 : 100;

          policiesToCreate.push({
            id: crypto.randomUUID(),
            clientId,
            agencyId,
            policyNumber: sanitizeString(row.policyNumber!).substring(0, 100),
            carrier: sanitizeString(row.carrier!).substring(0, 100),
            policyType: sanitizeString(row.policyType!).substring(0, 50),
            premium: row.premium!.replace(/[$,]/g, ''),
            effectiveDate: row.effectiveDate ? new Date(row.effectiveDate) : new Date(),
            expirationDate: new Date(row.expirationDate!),
            status: 'active', // Force active so it shows on dashboard
            healthStatus: healthStatus,
            healthScore: healthScore,
            _clientName: row.clientName!,
          });
        }

        // Batch insert all new clients (if any)
        if (clientsToCreate.size > 0) {
          await tx.insert(clients).values(Array.from(clientsToCreate.values()));
        }

        // Batch insert with UPSERT logic to handle duplicates gracefully
        const policiesData = policiesToCreate.map(({ _clientName, ...policy }) => policy);
        
        await tx
          .insert(policies)
          .values(policiesData)
          .onConflictDoUpdate({
            target: [policies.agencyId, policies.policyNumber],
            set: {
              carrier: sql`EXCLUDED.carrier`,
              policyType: sql`EXCLUDED.policy_type`,
              premium: sql`EXCLUDED.premium`,
              effectiveDate: sql`EXCLUDED.effective_date`,
              expirationDate: sql`EXCLUDED.expiration_date`,
              status: sql`EXCLUDED.status`,
              healthStatus: sql`EXCLUDED.health_status`,
              healthScore: sql`EXCLUDED.health_score`,
              updatedAt: new Date(),
            }
          });

        // Build success response
        const importedRows = policiesToCreate.map(p => ({
          clientName: p._clientName,
          policyNumber: p.policyNumber,
        }));

        // CLEAR CACHE TO ACTIVATE DASHBOARD
        try {
          const { deleteCachedPattern, CacheKeys } = await import('@/lib/redis');
          await Promise.all([
            deleteCachedPattern(`${CacheKeys.dashboardStats(agencyId)}*`),
            deleteCachedPattern(`policy:list:${agencyId}*`),
          ]);
          
          const { revalidatePath } = await import('next/cache');
          revalidatePath('/dashboard');
          revalidatePath('/');
        } catch (cacheErr) {
          logger.error('Failed to clear cache after import', cacheErr);
        }

        return NextResponse.json({
          success: true,
          imported: importedRows.length,
          importedRows,
          newClients: clientsToCreate.size,
          invalidRows: invalidRows.length > 0 ? invalidRows.map(r => ({
            clientName: r.row.clientName,
            errors: r.validation.errors,
          })) : undefined,
        });
      });
    } catch (error: any) {
      // Rollback is automatic since we use batch inserts
      // If any insert fails, no data is committed
      console.error('Import transaction failed:', error);
      return NextResponse.json({
        error: 'Import failed - no data was saved. Please check your CSV and try again.',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        imported: 0,
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    requiredPermission: 'manage_policies',
    rateLimit: 'upload',
    auditAction: 'import.csv',
  }
);
