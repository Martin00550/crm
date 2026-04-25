/**
 * Advanced Search and Filtering
 * Full-text search with PostgreSQL tsvector
 */

import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { eq, and, or, ilike, sql, desc, asc, gte, lte, SQL, SQLWrapper } from 'drizzle-orm';

export interface SearchFilters {
  query?: string;
  status?: string[];
  policyType?: string[];
  carrier?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  premiumMin?: number;
  premiumMax?: number;
  healthStatus?: string[];
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Full-text search for policies
 */
export async function searchPolicies(
  agencyId: string,
  filters: SearchFilters,
  options: SearchOptions = {}
) {
  const {
    query,
    status,
    policyType,
    carrier,
    dateFrom,
    dateTo,
    premiumMin,
    premiumMax,
    healthStatus,
  } = filters;

  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const offset = (page - 1) * limit;

  // Build conditions
  const conditions: (SQL<unknown> | SQLWrapper)[] = [eq(policies.agencyId, agencyId)];

  // Full-text search query
  if (query) {
    const searchTerms = query.split(/\s+/).filter(Boolean);
    const searchConditions = searchTerms.map(term => 
      sql`(
        ${policies.policyNumber} ILIKE ${'%' + term + '%'} OR
        ${policies.carrier} ILIKE ${'%' + term + '%'} OR
        ${policies.policyType} ILIKE ${'%' + term + '%'}
      )`
    );
    conditions.push(sql`(${sql.join(searchConditions, sql` AND `)})`);
  }

  // Status filter
  if (status && status.length > 0) {
    conditions.push(sql`${policies.status} = ANY(${status})`);
  }

  // Policy type filter
  if (policyType && policyType.length > 0) {
    conditions.push(sql`${policies.policyType} = ANY(${policyType})`);
  }

  // Carrier filter
  if (carrier && carrier.length > 0) {
    conditions.push(sql`${policies.carrier} = ANY(${carrier})`);
  }

  // Health status filter
  if (healthStatus && healthStatus.length > 0) {
    conditions.push(sql`${policies.healthStatus} = ANY(${healthStatus})`);
  }

  // Date range filter
  if (dateFrom) {
    conditions.push(gte(policies.effectiveDate, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(policies.expirationDate, dateTo));
  }

  // Premium range filter
  if (premiumMin) {
    conditions.push(sql`CAST(${policies.premium} AS NUMERIC) >= ${premiumMin}`);
  }
  if (premiumMax) {
    conditions.push(sql`CAST(${policies.premium} AS NUMERIC) <= ${premiumMax}`);
  }

  // Build sort
  const sortColumn = sortBy === 'premium' ? policies.premium :
                    sortBy === 'expirationDate' ? policies.expirationDate :
                    sortBy === 'effectiveDate' ? policies.effectiveDate :
                    sortBy === 'healthScore' ? policies.healthScore :
                    policies.createdAt;
  
  const sortDirection = sortOrder === 'asc' ? asc : desc;

  // Execute search
  const results = await db
    .select()
    .from(policies)
    .where(and(...conditions))
    .orderBy(sortDirection(sortColumn))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(policies)
    .where(and(...conditions));

  return {
    results,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Full-text search for clients
 */
export async function searchClients(
  agencyId: string,
  filters: {
    query?: string;
    industry?: string[];
  },
  options: SearchOptions = {}
) {
  const { query, industry } = filters;
  const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const offset = (page - 1) * limit;

  const conditions: (SQL<unknown> | SQLWrapper)[] = [eq(clients.agencyId, agencyId)];

  // Full-text search query
  if (query) {
    const searchTerms = query.split(/\s+/).filter(Boolean);
    const searchConditions = searchTerms.map(term => 
      sql`(
        ${clients.name} ILIKE ${'%' + term + '%'} OR
        ${clients.email} ILIKE ${'%' + term + '%'} OR
        ${clients.phone} ILIKE ${'%' + term + '%'} OR
        ${clients.address} ILIKE ${'%' + term + '%'}
      )`
    );
    conditions.push(sql`(${sql.join(searchConditions, sql` AND `)})`);
  }

  // Industry filter
  if (industry && industry.length > 0) {
    conditions.push(sql`${clients.industry} = ANY(${industry})`);
  }

  const sortColumn = sortBy === 'name' ? clients.name : clients.createdAt;
  const sortDirection = sortOrder === 'asc' ? asc : desc;

  const results = await db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(sortDirection(sortColumn))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clients)
    .where(and(...conditions));

  return {
    results,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Get filter options (distinct values)
 */
export async function getFilterOptions(agencyId: string) {
  const [carriers, policyTypes, industries] = await Promise.all([
    db
      .selectDistinct({ carrier: policies.carrier })
      .from(policies)
      .where(eq(policies.agencyId, agencyId))
      .orderBy(asc(policies.carrier)),
    db
      .selectDistinct({ policyType: policies.policyType })
      .from(policies)
      .where(eq(policies.agencyId, agencyId))
      .orderBy(asc(policies.policyType)),
    db
      .selectDistinct({ industry: clients.industry })
      .from(clients)
      // @ts-ignore
      .where(eq(clients.agencyId, agencyId))
      .orderBy(asc(clients.industry)),
  ]);

  return {
    carriers: (carriers as any[]).map(c => c.carrier).filter(Boolean),
    policyTypes: (policyTypes as any[]).map(p => p.policyType).filter(Boolean),
    industries: (industries as any[]).map(i => i.industry).filter(Boolean),
  };
}
