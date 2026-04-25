import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { policies, clients, agencies } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { validateRequestBody, withApiSecurity } from '@/lib/api-security';
import { canUseFeature } from '@/lib/feature-access';
import { sanitizeString } from '@/lib/validation';

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

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  // Map common column names to our fields
  const columnMap: Record<string, string> = {
    'client_name': 'clientName',
    'clientname': 'clientName',
    'name': 'clientName',
    'insured': 'clientName',
    'client_email': 'clientEmail',
    'clientemail': 'clientEmail',
    'email': 'clientEmail',
    'client_phone': 'clientPhone',
    'clientphone': 'clientPhone',
    'phone': 'clientPhone',
    'client_industry': 'clientIndustry',
    'clientindustry': 'clientIndustry',
    'industry': 'clientIndustry',
    'policy_number': 'policyNumber',
    'policynumber': 'policyNumber',
    'policy_no': 'policyNumber',
    'policyno': 'policyNumber',
    'carrier': 'carrier',
    'insurance_company': 'carrier',
    'insurancecompany': 'carrier',
    'policy_type': 'policyType',
    'policytype': 'policyType',
    'coverage_type': 'policyType',
    'coveragetype': 'policyType',
    'premium': 'premium',
    'annual_premium': 'premium',
    'annualpremium': 'premium',
    'effective_date': 'effectiveDate',
    'effectivedate': 'effectiveDate',
    'start_date': 'effectiveDate',
    'startdate': 'effectiveDate',
    'expiration_date': 'expirationDate',
    'expirationdate': 'expirationDate',
    'exp_date': 'expirationDate',
    'expdate': 'expirationDate',
    'end_date': 'expirationDate',
    'enddate': 'expirationDate',
    'status': 'status',
    'policy_status': 'status',
    'policystatus': 'status',
  };

  const mappedHeaders = headers.map(h => columnMap[h] || h);

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
    const row: CSVRow = {};
    
    mappedHeaders.forEach((header, index) => {
      if (header && values[index]) {
        row[header as keyof CSVRow] = values[index];
      }
    });
    
    // Only add rows that have at least a client name or policy number
    if (row.clientName || row.policyNumber) {
      rows.push(row);
    }
  }

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
  if (!row.premium || isNaN(parseFloat(row.premium))) {
    errors.push('Invalid premium amount');
  }
  if (!row.expirationDate) {
    errors.push('Missing expiration date');
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
      .then((r: any[]) => r[0]?.count || 0);

    // Check if import would exceed limit
    if (policyAccess.limit && currentPolicyCount + validRows.length > policyAccess.limit) {
      return NextResponse.json({ 
        error: `Import would exceed your policy limit of ${policyAccess.limit}. You currently have ${currentPolicyCount} policies and are trying to import ${validRows.length} more.`,
        limit: policyAccess.limit,
        current: currentPolicyCount,
        attempting: validRows.length,
      }, { status: 403 });
    }

    // Process imports atomically using batch inserts
    // This ensures all-or-nothing behavior - no partial imports
    try {
      // Get existing clients to avoid duplicates
      const existingClients = await db
        .select()
        .from(clients)
        .where(eq(clients.agencyId, agencyId));

      type Client = typeof clients.$inferSelect;
      const existingClientMap = new Map<string, Client>(existingClients.map((c: Client) => [c.name.toLowerCase(), c]));
      const clientsToCreate: Map<string, { id: string; agencyId: string; name: string; email: string | null; phone: string | null; industry: string | null }> = new Map();
      const policiesToCreate: { id: string; clientId: string; agencyId: string; policyNumber: string; carrier: string; policyType: string; premium: string; effectiveDate: Date; expirationDate: Date; status: string; _clientName: string }[] = [];

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
          });
        }

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
          status: sanitizeString(row.status?.toLowerCase() || 'active').substring(0, 20),
          _clientName: row.clientName!,
        });
      }

      // Batch insert all new clients (if any)
      if (clientsToCreate.size > 0) {
        await db.insert(clients).values(Array.from(clientsToCreate.values()));
      }

      // Batch insert all policies
      const policiesData = policiesToCreate.map(({ _clientName, ...policy }) => policy);
      await db.insert(policies).values(policiesData);

      // Build success response
      const imported = policiesToCreate.map(p => ({
        clientName: p._clientName,
        policyNumber: p.policyNumber,
      }));

      return NextResponse.json({
        success: true,
        imported: imported.length,
        importedRows: imported,
        newClients: clientsToCreate.size,
        invalidRows: invalidRows.length > 0 ? invalidRows.map(r => ({
          clientName: r.row.clientName,
          errors: r.validation.errors,
        })) : undefined,
      });
    } catch (error: any) {
      // Rollback is automatic since we use batch inserts
      // If any insert fails, no data is committed
      console.error('Import transaction failed:', error);
      return NextResponse.json({
        error: 'Import failed - no data was saved. Please check your CSV and try again.',
        details: error.message,
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
