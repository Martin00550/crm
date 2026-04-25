import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import {
  createDatabaseBackup,
  restoreFromBackup,
  getBackupHistory,
  cleanupOldBackups,
  exportAgencyData,
  scheduleAutomatedBackups,
} from '@/lib/backup';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'history') {
      const history = await getBackupHistory(agencyId);
      return NextResponse.json(history);
    }

    if (action === 'export') {
      const data = await exportAgencyData(agencyId);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'backup.view',
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { action, backupId, retentionDays } = body;

    if (action === 'create') {
      const result = await createDatabaseBackup(agencyId);
      return NextResponse.json(result);
    }

    if (action === 'restore' && backupId) {
      const result = await restoreFromBackup(backupId, agencyId);
      return NextResponse.json({ success: result });
    }

    if (action === 'schedule') {
      await scheduleAutomatedBackups(agencyId);
      return NextResponse.json({ success: true });
    }

    if (action === 'cleanup') {
      await cleanupOldBackups(agencyId, retentionDays || 30);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'backup.manage',
  }
);
