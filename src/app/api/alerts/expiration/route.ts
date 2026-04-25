import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import {
  getExpiringPolicies,
  sendExpirationAlerts,
  sendAgentAlert,
  sendInsuredReminder,
  getExpirationAlertSummary,
  scheduleExpirationChecks,
} from '@/lib/expiration-alerts';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const days = parseInt(searchParams.get('days') || '30');

    if (action === 'list') {
      const alerts = await getExpiringPolicies(agencyId, days);
      return NextResponse.json(alerts);
    }

    if (action === 'summary') {
      const summary = await getExpirationAlertSummary(agencyId);
      return NextResponse.json(summary);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'alerts.view',
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { action, policyId, days } = body;

    if (action === 'send_all') {
      const results = await sendExpirationAlerts(agencyId, days || 30);
      return NextResponse.json(results);
    }

    if (action === 'send_agent' && policyId) {
      const alerts = await getExpiringPolicies(agencyId, 30);
      const alert = alerts.find(a => a.policyId === policyId);
      if (!alert) {
        return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      }
      await sendAgentAlert(agencyId, alert);
      return NextResponse.json({ success: true });
    }

    if (action === 'send_insured' && policyId) {
      const alerts = await getExpiringPolicies(agencyId, 30);
      const alert = alerts.find(a => a.policyId === policyId);
      if (!alert) {
        return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      }
      await sendInsuredReminder(alert);
      return NextResponse.json({ success: true });
    }

    if (action === 'schedule') {
      await scheduleExpirationChecks(agencyId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'alerts.send',
  }
);
