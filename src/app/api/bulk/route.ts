import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { invalidateResourceCache } from '@/lib/redis';

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { action, type, ids, data } = body;

    if (!action || !type || !ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid bulk operation request' }, { status: 400 });
    }

    if (type === 'policies') {
      if (action === 'delete') {
        await db
          .delete(policies)
          .where(and(inArray(policies.id, ids), eq(policies.agencyId, agencyId)));
        
        // Invalidate cache
        for (const id of ids) {
          await invalidateResourceCache('policy', id);
        }
        await invalidateResourceCache('dashboard', agencyId);
        
        return NextResponse.json({ success: true, deleted: ids.length });
      }

      if (action === 'update') {
        const updates: any = {};
        if (data.status !== undefined) updates.status = data.status;
        if (data.healthStatus !== undefined) updates.healthStatus = data.healthStatus;
        if (data.carrier !== undefined) updates.carrier = data.carrier;
        updates.updatedAt = new Date();

        await db
          .update(policies)
          .set(updates)
          .where(and(inArray(policies.id, ids), eq(policies.agencyId, agencyId)));
        
        // Invalidate cache
        for (const id of ids) {
          await invalidateResourceCache('policy', id);
        }
        await invalidateResourceCache('dashboard', agencyId);
        
        return NextResponse.json({ success: true, updated: ids.length });
      }

      if (action === 'export') {
        const policiesList = await db
          .select()
          .from(policies)
          .where(and(inArray(policies.id, ids), eq(policies.agencyId, agencyId)));
        
        const csv = [
          'Policy Number,Carrier,Policy Type,Premium,Effective Date,Expiration Date,Status,Health Status',
          ...policiesList.map((p: any) =>
            `"${p.policyNumber}","${p.carrier}","${p.policyType}","${p.premium}","${p.effectiveDate}","${p.expirationDate}","${p.status}","${p.healthStatus}"`
          ),
        ].join('\n');

        return NextResponse.json({ success: true, csv, count: policiesList.length });
      }
    }

    if (type === 'clients') {
      if (action === 'delete') {
        await db
          .delete(clients)
          .where(and(inArray(clients.id, ids), eq(clients.agencyId, agencyId)));
        
        // Invalidate cache
        for (const id of ids) {
          await invalidateResourceCache('client', id);
        }
        
        return NextResponse.json({ success: true, deleted: ids.length });
      }

      if (action === 'update') {
        const updates: any = {};
        if (data.industry !== undefined) updates.industry = data.industry;
        if (data.portalAccessEnabled !== undefined) updates.portalAccessEnabled = data.portalAccessEnabled;
        updates.updatedAt = new Date();

        await db
          .update(clients)
          .set(updates)
          .where(and(inArray(clients.id, ids), eq(clients.agencyId, agencyId)));
        
        // Invalidate cache
        for (const id of ids) {
          await invalidateResourceCache('client', id);
        }
        
        return NextResponse.json({ success: true, updated: ids.length });
      }
    }

    return NextResponse.json({ error: 'Unsupported bulk operation' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'bulk.operation',
  }
);
