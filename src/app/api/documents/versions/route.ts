import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import { getDocumentHistory, restoreDocumentVersion } from '@/lib/document-management';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const history = await getDocumentHistory(documentId, agencyId);
    return NextResponse.json(history);
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'document.history',
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId, userId } = context;
    if (!agencyId || !userId) {
      return NextResponse.json({ error: 'Agency ID and User ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { documentId, version } = body;

    if (!documentId || !version) {
      return NextResponse.json({ error: 'Document ID and version required' }, { status: 400 });
    }

    const result = await restoreDocumentVersion(documentId, agencyId, parseInt(version), userId);
    return NextResponse.json(result);
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'document.restore',
  }
);
