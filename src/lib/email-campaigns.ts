/**
 * Email Campaign Management for Insurance Agencies
 * Drip campaigns for renewal reminders, rate hike communications, and cross-selling
 */

import { db } from '@/lib/db';
import { policies, clients, users } from '@/db/schema';
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'renewal_reminder' | 'rate_hike' | 'cross_sell' | 'certificate_request' | 'custom';
  variables: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  targetSegment: string;
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  scheduledFor?: Date;
  sentAt?: Date;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

export interface CampaignTarget {
  type: 'all_policies' | 'at_risk' | 'expiring_soon' | 'specific_carrier' | 'specific_policy_type' | 'custom';
  filters?: {
    carrier?: string[];
    policyType?: string[];
    daysUntilExpiration?: number[];
    premiumRange?: { min: number; max: number };
  };
}

/**
 * Pre-built email templates for insurance agencies
 */
export const emailTemplates: EmailTemplate[] = [
  {
    id: 'renewal_reminder_30_days',
    name: 'Renewal Reminder - 30 Days',
    subject: 'Your {{policyType}} policy renewal is approaching',
    body: `Dear {{insuredName}},

Your {{policyType}} policy with {{carrier}} is set to expire on {{expirationDate}}.

We want to ensure you have continuous coverage without any gaps. Our team is already reviewing your policy to make sure you're getting the best possible rate.

If you have any questions or would like to discuss coverage options, please don't hesitate to reach out.

Best regards,
{{agentName}}`,
    type: 'renewal_reminder',
    variables: ['insuredName', 'policyType', 'carrier', 'expirationDate', 'agentName'],
  },
  {
    id: 'rate_hike_explanation',
    name: 'Rate Hike Explanation',
    subject: 'Important update regarding your {{policyType}} policy',
    body: `Dear {{insuredName}},

We're writing to inform you about an upcoming change to your {{policyType}} policy premium.

After conducting a thorough market analysis, we've identified that your premium will be adjusted to {{newPremium}} (previously {{oldPremium}}). This change reflects current market conditions and ensures your coverage remains adequate.

Our AI-powered analysis shows that:
{{aiInsights}}

We understand rate changes can be concerning. We've prepared a detailed explanation and are available to discuss options that might help mitigate this increase.

Sincerely,
{{agentName}}`,
    type: 'rate_hike',
    variables: ['insuredName', 'policyType', 'newPremium', 'oldPremium', 'aiInsights', 'agentName'],
  },
  {
    id: 'cross_sell_opportunity',
    name: 'Cross-Sell Opportunity',
    subject: 'Additional coverage options for your business',
    body: `Dear {{insuredName}},

Based on your current {{existingPolicyType}} coverage, we've identified an opportunity to strengthen your protection.

Many businesses in your industry also benefit from {{suggestedPolicyType}} coverage. This can help protect against:

{{benefits}}

Would you like us to provide a quote for this additional coverage?

Best regards,
{{agentName}}`,
    type: 'cross_sell',
    variables: ['insuredName', 'existingPolicyType', 'suggestedPolicyType', 'benefits', 'agentName'],
  },
  {
    id: 'certificate_request',
    name: 'Certificate Request',
    subject: 'Certificate of Insurance Request',
    body: `Dear {{insuredName},

We've received a request for your Certificate of Insurance for {{projectName}}.

Please review the details below and let us know if any changes are needed.

{{certificateDetails}}

Best regards,
{{agentName}}`,
    type: 'certificate_request',
    variables: ['insuredName', 'projectName', 'certificateDetails', 'agentName'],
  },
];

/**
 * Get policies matching campaign target criteria
 */
export async function getTargetPolicies(agencyId: string, target: CampaignTarget) {
  const conditions = [eq(policies.agencyId, agencyId), eq(policies.status, 'active')];

  if (target.type === 'at_risk') {
    conditions.push(eq(policies.healthStatus, 'at-risk'));
  }

  if (target.type === 'expiring_soon' && target.filters?.daysUntilExpiration) {
    const now = new Date();
    const minDate = new Date(now.getTime() + target.filters.daysUntilExpiration[0] * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + target.filters.daysUntilExpiration[1] * 24 * 60 * 60 * 1000);
    conditions.push(gte(policies.expirationDate, minDate));
    conditions.push(lte(policies.expirationDate, maxDate));
  }

  if (target.type === 'specific_carrier' && target.filters?.carrier) {
    conditions.push(sql`${policies.carrier} = ANY(${target.filters.carrier})`);
  }

  if (target.type === 'specific_policy_type' && target.filters?.policyType) {
    conditions.push(sql`${policies.policyType} = ANY(${target.filters.policyType})`);
  }

  if (target.filters?.premiumRange) {
    conditions.push(sql`CAST(${policies.premium} AS NUMERIC) >= ${target.filters.premiumRange.min}`);
    conditions.push(sql`CAST(${policies.premium} AS NUMERIC) <= ${target.filters.premiumRange.max}`);
  }

  const policiesList = await db
    .select()
    .from(policies)
    .where(and(...conditions));

  return policiesList;
}

/**
 * Send email campaign to target policies
 */
export async function sendCampaign(
  agencyId: string,
  template: EmailTemplate,
  target: CampaignTarget,
  variables: Record<string, any>
) {
  if (!resend) {
    throw new Error('Email service not configured');
  }

  const policiesList = await getTargetPolicies(agencyId, target);
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const policy of policiesList) {
    try {
      // Get client information
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, policy.clientId))
        .limit(1)
        .then((r: any[]) => r[0]);

      // Get agent information
      const agent = await db
        .select()
        .from(users)
        .where(eq(users.agencyId, agencyId))
        .limit(1)
        .then((r: any[]) => r[0]);

      // Replace template variables
      let subject = template.subject;
      let body = template.body;

      const templateVars = {
        insuredName: client?.name || 'Valued Client',
        policyType: policy.policyType,
        carrier: policy.carrier,
        expirationDate: new Date(policy.expirationDate).toLocaleDateString(),
        premium: policy.premium,
        policyNumber: policy.policyNumber,
        agentName: agent?.name || 'Your Insurance Team',
        ...variables,
      };

      for (const [key, value] of Object.entries(templateVars)) {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      await resend.emails.send({
        from: 'BookGuard <noreply@bookguard.tech>',
        to: client?.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #22c55e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0;">BookGuard</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
              <div style="white-space: pre-line; line-height: 1.6; color: #374151;">${body}</div>
            </div>
            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
              This email was sent by BookGuard CRM. If you no longer wish to receive these emails, please reply with "unsubscribe".
            </p>
          </div>
        `,
      });

      results.sent++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to send to policy ${policy.id}: ${error}`);
    }
  }

  return results;
}

/**
 * Schedule automated renewal reminders
 */
export async function scheduleRenewalReminders(agencyId: string, daysBefore: number[] = [30, 14, 7, 1]) {
  const template = emailTemplates.find(t => t.id === 'renewal_reminder_30_days');
  
  if (!template) {
    throw new Error('Renewal reminder template not found');
  }

  const results = [];

  for (const days of daysBefore) {
    const target: CampaignTarget = {
      type: 'expiring_soon',
      filters: {
        daysUntilExpiration: [days - 2, days + 2],
      },
    };

    const result = await sendCampaign(agencyId, template, target, {});
    results.push({ days, ...result });
  }

  return results;
}
