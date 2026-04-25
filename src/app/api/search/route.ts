import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import { searchPolicies, searchClients, getFilterOptions } from '@/lib/search';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get('type') || 'policies';
    const query = searchParams.get('q') || undefined;
    const status = searchParams.getAll('status');
    const policyType = searchParams.getAll('policyType');
    const carrier = searchParams.getAll('carrier');
    const healthStatus = searchParams.getAll('healthStatus');
    const industry = searchParams.getAll('industry');
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('date')!) : undefined;
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
    const premiumMin = searchParams.get('premiumMin') ? parseFloat(searchParams.get('premiumMin')!) : undefined;
    const premiumMax = searchParams.get('premiumMax') ? parseFloat(searchParams.get('premiumMax')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    if (searchParams.get('options') === 'true') {
      const options = await getFilterOptions(agencyId!);
      return NextResponse.json(options);
    }

    if (type === 'policies') {
      const results = await searchPolicies(
        agencyId!,
        {
          query,
          status,
          policyType,
          carrier,
          healthStatus,
          dateFrom,
          dateTo,
          premiumMin,
          premiumMax,
        },
        { page, limit, sortBy, sortOrder }
      );
      return NextResponse.json(results);
    }

    if (type === 'clients') {
      const results = await searchClients(
        agencyId!,
        { query, industry },
        { page, limit, sortBy, sortOrder }
      );
      return NextResponse.json(results);
    }

    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'search',
  }
);
