import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { documents, clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const { id: clientId } = await params;

    // Verify client belongs to agency
    const client = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(
        eq(clients.id, clientId),
        eq(clients.agencyId, agencyId)
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get client's documents
    const clientDocuments = await db
      .select({
        id: documents.id,
        filename: documents.fileName,
        category: documents.category,
        uploadedAt: documents.createdAt,
        fileSize: documents.fileSize,
        mimeType: documents.fileType,
      })
      .from(documents)
      .where(and(
        eq(documents.clientId, clientId),
        eq(documents.agencyId, agencyId)
      ))
      .orderBy(documents.createdAt);

    return NextResponse.json({
      success: true,
      documents: clientDocuments,
    });
  } catch (error) {
    console.error('Error fetching client documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
