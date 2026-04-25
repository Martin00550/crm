import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import {
  getDashboardLayout,
  saveDashboardLayout,
  addWidget,
  removeWidget,
  updateWidget,
  resetDashboardLayout,
  widgetTypes,
} from '@/lib/dashboard-customization';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId } = context;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'types') {
      return NextResponse.json(widgetTypes);
    }

    const layout = await getDashboardLayout(userId!);
    return NextResponse.json(layout);
  },
  {
    requireAuth: true,
    rateLimit: 'api',
    auditAction: 'dashboard.layout.view',
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId } = context;
    const body = await request.json();
    const { action, widgetId, type, config, position, visible, widgets } = body;

    if (action === 'save' && widgets) {
      const layout = await saveDashboardLayout(userId!, widgets);
      return NextResponse.json(layout);
    }

    if (action === 'add' && type) {
      const layout = await addWidget(userId!, type, config);
      return NextResponse.json(layout);
    }

    if (action === 'remove' && widgetId) {
      const layout = await removeWidget(userId!, widgetId);
      return NextResponse.json(layout);
    }

    if (action === 'update' && widgetId) {
      const layout = await updateWidget(userId!, widgetId, { position, config, visible });
      return NextResponse.json(layout);
    }

    if (action === 'reset') {
      const layout = await resetDashboardLayout(userId!);
      return NextResponse.json(layout);
    }


    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  },
  {
    requireAuth: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'dashboard.layout.update',
  }
);
