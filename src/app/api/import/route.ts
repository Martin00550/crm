import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { policies, clients, agencies } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { validateRequestBody, withApiSecurity } from '@/lib/api-security';
import { canUseFeature } from '@/lib/feature-access';
import { sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { inngest } from '@/lib/inngest-client';
import { importJobs } from '@/db/schema';

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
  // Metadata for unmapped fields
  _extraData?: Record<string, string>;
  _warnings?: string[];
  [key: string]: any;
}

// Robust Date Parser
function parseFlexibleDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Try some common formats that JS Date might struggle with
  // e.g. DD/MM/YYYY or MM-DD-YYYY
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    // Try YYYY-MM-DD
    if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    // Try MM-DD-YYYY
    if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  return null;
}

// Robust Premium Parser
function parsePremium(val: string | undefined): string {
  if (!val) return '0';
  const cleaned = val.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? '0' : num.toString();
}

import Papa from 'papaparse';

function parseCSV(csvText: string, customMapping?: Record<string, string>): CSVRow[] {
  // Strip BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  
  const result = Papa.parse(cleanText, {
    header: true,
    skipEmptyLines: 'greedy',
    // Auto-detect delimiter but also try common ones if detection fails
    delimitersToGuess: [',', ';', '\t', '|'],
    // Remove all non-alphanumeric chars for ultra-robust mapping
    transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
  });

  if (result.errors.length > 0) {
    console.error('PapaParse errors:', result.errors);
  }

  const defaultColumnMap: Record<string, string> = {
    'clientname': 'clientName',
    'name': 'clientName',
    'insured': 'clientName',
    'insuredname': 'clientName',
    'customer': 'clientName',
    'customername': 'clientName',
    'clientemail': 'clientEmail',
    'email': 'clientEmail',
    'clientphone': 'clientPhone',
    'phone': 'clientPhone',
    'industry': 'clientIndustry',
    'clientindustry': 'clientIndustry',
    'policynumber': 'policyNumber',
    'policyno': 'policyNumber',
    'polnum': 'policyNumber',
    'policyid': 'policyNumber',
    'carrier': 'carrier',
    'insurancecompany': 'carrier',
    'company': 'carrier',
    'insurer': 'carrier',
    'policytype': 'policyType',
    'coveragetype': 'policyType',
    'lob': 'policyType',
    'lineofbusiness': 'policyType',
    'premium': 'premium',
    'writtenpremium': 'premium',
    'annualpremium': 'premium',
    'amount': 'premium',
    'effectivedate': 'effectiveDate',
    'startdate': 'effectiveDate',
    'expirationdate': 'expirationDate',
    'renewaldate': 'expirationDate',
    'expdate': 'expirationDate',
    'enddate': 'expirationDate',
    'status': 'status',
    'policystatus': 'status',
  };

  const columnMap = { ...defaultColumnMap, ...(customMapping || {}) };

  const rows: CSVRow[] = [];
  
  if (result.errors.length > 0) {
    logger.error('PapaParse errors detected during import', { errors: result.errors });
  }

  const data = result.data as Array<Record<string, unknown>>;
  const headers = result.meta.fields || [];

  // ULTRA-ADVANCED: Fuzzy Header Auto-Detection
  // If required fields are missing from mapping, try to find them by scanning all headers
  const requiredFields = ['clientName', 'policyNumber', 'carrier', 'policyType', 'premium', 'expirationDate'];
  const mappedTargetFields = new Set(Object.values(columnMap));

  requiredFields.forEach(field => {
    if (!mappedTargetFields.has(field)) {
      // Try to find a header that looks like this field
      const fuzzyMatch = headers.find(h => {
        const normH = h.toLowerCase();
        if (field === 'clientName') return normH.includes('name') || normH.includes('insured') || normH.includes('customer');
        if (field === 'policyNumber') return normH.includes('pol') || normH.includes('number') || normH.includes('id');
        if (field === 'carrier') return normH.includes('carrier') || normH.includes('company') || normH.includes('insurer');
        if (field === 'policyType') return normH.includes('type') || normH.includes('lob') || normH.includes('coverage');
        if (field === 'premium') return normH.includes('premium') || normH.includes('amount') || normH.includes('written');
        if (field === 'expirationDate') return normH.includes('exp') || normH.includes('renewal') || normH.includes('end');
        return false;
      });

      if (fuzzyMatch) {
        const normalizedMatch = fuzzyMatch.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        columnMap[normalizedMatch] = field;
        logger.info(`Fuzzy matched missing field: ${field} -> ${fuzzyMatch}`);
      }
    }
  });

  data.forEach((item, index) => {
    const row: CSVRow = { _extraData: {}, _warnings: [] };
    
    Object.keys(item).forEach((header) => {
      const mappedField = columnMap[header];
      if (mappedField && requiredFields.concat(['clientEmail', 'clientPhone', 'clientIndustry', 'status', 'effectiveDate']).includes(mappedField)) {
        if (item[header]) {
          row[mappedField as keyof CSVRow] = String(item[header]).trim();
        }
      } else if (item[header]) {
        // Save unmapped data into _extraData so no information is lost
        row._extraData![header] = String(item[header]).trim();
      }
    });

    // Data Recovery & Normalization
    if (!row.clientName) {
      row.clientName = row.name || row.insured || row.customer || 'Unnamed Client';
      row._warnings!.push('Client name was missing and auto-filled.');
    }

    if (!row.carrier) row.carrier = 'Unknown Carrier';
    if (!row.policyType) row.policyType = 'Other';
    row.premium = parsePremium(row.premium);

    // Smart Date Estimation (Unfailable Dates)
    let effDate = parseFlexibleDate(row.effectiveDate);
    let expDate = parseFlexibleDate(row.expirationDate || row.expDate || row.renewalDate);

    if (!expDate) {
      // If no expiration date, default to 1 year after effective date (or 1 year from now)
      const baseDate = effDate || new Date();
      expDate = new Date(baseDate);
      expDate.setFullYear(expDate.getFullYear() + 1);
      row._warnings!.push('Expiration date was missing or invalid; auto-set to 1 year from now/effective date.');
    }

    row.effectiveDate = (effDate || new Date()).toISOString();
    row.expirationDate = expDate.toISOString();

    // Handle missing policy number - make it unique using the index
    if (!row.policyNumber) {
      const nameForHash = row.clientName || 'anonymous';
      const hash = Math.abs(nameForHash.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));
      row.policyNumber = `T-${hash.toString(16).toUpperCase().substring(0, 6)}-${(index + 1).toString().padStart(3, '0')}`;
      row._warnings!.push('Policy number was missing and auto-generated.');
    }

    // Every row is considered "valid enough" to push in unfailable mode
    rows.push(row);
  });

  if (rows.length === 0 && data.length > 0) {
    logger.warn('Rows were parsed but none were valid for import (missing clientName and policyNumber)', {
      firstRow: data[0],
      columnMap
    });
  }

  return rows;
}

function validateRow(row: CSVRow): { valid: boolean; errors: string[] } {
  // In "Unfailable" mode, we almost never reject a row.
  // We only fail if there is literally no data at all.
  if (!row.clientName && !row.policyNumber && Object.keys(row._extraData || {}).length === 0) {
    return { valid: false, errors: ['Completely empty row'] };
  }
  return { valid: true, errors: [] };
}

// POST /api/import - Import policies from CSV (requires manage_policies permission)
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
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
    const mappingStr = formData.get('mapping') as string;
    let customMapping: Record<string, string> | undefined;
    
    if (mappingStr) {
      try {
        customMapping = JSON.parse(mappingStr);
      } catch (e) {
        console.error('Failed to parse custom mapping:', e);
      }
    }

    const rows = parseCSV(csvText, customMapping);

    if (rows.length === 0) {
      // Try to determine why it failed to find any rows
      const preview = csvText.substring(0, 200);
      logger.warn('No valid data rows found in CSV', { 
        textSize: csvText.length, 
        preview,
        mapping: customMapping
      });
      
      return NextResponse.json({ 
        error: 'No valid data rows found in CSV',
        details: 'The system could not identify any policy data in your file. Please ensure your CSV has a header row with field names like "Client Name", "Policy Number", etc.'
      }, { status: 400 });
    }

    // ENTERPRISE GRADE: Create a background job and trigger Inngest
    const [job] = await db.insert(importJobs).values({
      id: crypto.randomUUID(),
      agencyId,
      userId: userId!,
      fileName: file.name,
      status: 'pending',
      totalRows: rows.length,
    }).returning();

    await inngest.send({
      name: 'import/csv.requested',
      data: {
        jobId: job.id,
        agencyId,
        userId: userId!,
        rows, // For very large files, you might store this in S3/Redis first
      },
    });

    return NextResponse.json({
      success: true,
      message: "Import started in background",
      jobId: job.id,
      totalRows: rows.length
    });
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({
      error: 'Import failed to start.',
      details: error.message,
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
