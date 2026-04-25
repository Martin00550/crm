import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { documents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';

// POST /api/documents/[id]/download - Track document download
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
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
    console.error('Error tracking download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
