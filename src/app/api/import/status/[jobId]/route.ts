import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withApiSecurity } from '@/lib/api-security';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { params } = context as { params: { jobId: string } };
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const job = await db.query.importJobs.findFirst({
      where: eq(importJobs.id, jobId),
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  },
  {
    requireAuth: true,
    requireAgency: true,
  }
);
