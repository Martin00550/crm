import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import { sendCampaign, scheduleRenewalReminders, emailTemplates, getTargetPolicies } from '@/lib/email-campaigns';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;

    return NextResponse.json({
      templates: emailTemplates,
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'campaigns.list',
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { action, templateId, target, variables } = body;

    if (action === 'send') {
      const template = emailTemplates.find(t => t.id === templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      const result = await sendCampaign(agencyId, template, target, variables);
      return NextResponse.json(result);
    }

    if (action === 'schedule_renewals') {
      const result = await scheduleRenewalReminders(agencyId);
      return NextResponse.json(result);
    }

    if (action === 'preview_target') {
      const policies = await getTargetPolicies(agencyId, target);
      return NextResponse.json({ count: policies.length, policies });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'emailSend',
    auditAction: 'campaign.send',
  }
);
