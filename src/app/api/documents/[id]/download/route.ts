import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { documents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

import { withApiSecurity } from '@/lib/api-security';

// POST /api/documents/[id]/download - Track document download
export const POST = withApiSecurity(
  async (
    request: NextRequest,
    context
  ) => {
    try {
      const { params, agencyId, userId } = context;
      const { id } = params;
      
      if (!agencyId) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      // Get document and increment download count
      const document = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, id),
          eq(documents.agencyId, agencyId)
        ))
        .limit(1)
        .then((r: any[]) => r[0]);

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Increment download count
      await db
        .update(documents)
        .set({ 
          downloadCount: document.downloadCount + 1,
        })
        .where(eq(documents.id, id));

      return NextResponse.json({
        success: true,
        downloadCount: document.downloadCount + 1,
      });
    } catch (error) {
      logger.error('Error tracking download', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
  }
);
