import { Resend } from 'resend';
import { logger } from '@/lib/logger';

export interface TeamInvitation {
  id: string;
  email: string;
  name: string | null;
  role: string;
  token: string;
  agencyName: string;
  expiresAt: Date;
}

export interface Policy {
  id: string;
  clientId: string;
  agencyId: string;
  policyNumber: string;
  carrier: string;
  policyType: string;
  premium: string;
  currentTermPremium: string | null;
  previousTermPremium: string | null;
  effectiveDate: Date;
  expirationDate: Date;
  status: string | null;
  healthScore: number | null;
  healthStatus: string | null;
  notes: string | null;
}

export interface Client {
  id: string;
  agencyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  maxRetries = 3
): Promise<{ success: boolean; error?: string }> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await resend.emails.send({
        from: 'RetainVault <noreply@retainvault.com>',
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      lastError = error;
      logger.error('Email send attempt failed', { attempt, maxRetries, error: error instanceof Error ? error.message : 'Unknown error' });
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return { success: false, error: lastError?.message || 'Failed to send email' };
}

export interface RenewalEmailData {
  client: Client;
  policy: Policy;
  daysUntilRenewal: number;
  renewalDate: Date;
}

export async function sendRenewalEmail(
  client: Client,
  policy: Policy,
  daysUntilRenewal: number
) {
  if (!client.email) {
    logger.info('No email address for client', { clientName: client.name });
    return { success: false, error: 'No email' };
  }

  const subject = daysUntilRenewal <= 30 
    ? `Action Required: Your ${policy.policyType} Policy Renews in ${daysUntilRenewal} Days`
    : `Your ${policy.policyType} Policy Renewal Preview - ${daysUntilRenewal} Days Out`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Policy Renewal Notice</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #191c1e; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f7f9fb;">
  <div style="background: linear-gradient(135deg, #041627 0%, #0a2540 100%); padding: 40px 30px; border-radius: 20px 20px 0 0; text-align: center;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">RetainVault</h1>
          <p style="color: #8192a7; margin: 10px 0 0; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Insurance Renewal Management</p>
        </td>
      </tr>
    </table>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e8eaed; border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <p style="margin: 0 0 24px; font-size: 16px; color: #44474c;">Dear ${client.name},</p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #44474c;">
      This is a professional reminder that your <strong style="color: #191c1e;">${policy.policyType}</strong> policy 
      with <strong style="color: #191c1e;">${policy.carrier}</strong> 
      is scheduled to renew in <strong style="color: ${daysUntilRenewal <= 30 ? '#ba1a1a' : '#006c49'}; font-size: 18px;">${daysUntilRenewal} days</strong>.
    </p>
    
    <div style="background: linear-gradient(135deg, #f7f9fb 0%, #ffffff 100%); padding: 24px; border-radius: 16px; margin: 28px 0; border: 1px solid #e8eaed;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Policy Number</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 14px; color: #191c1e; font-variant-numeric: tabular-nums;">${policy.policyNumber}</td>
        </tr>
        <tr>
          <td colspan="2" style="height: 1px; background: #e8eaed;"></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Current Premium</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 16px; color: #006c49; font-variant-numeric: tabular-nums;">$${parseFloat(policy.premium).toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="2" style="height: 1px; background: #e8eaed;"></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Coverage Type</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 14px; color: #191c1e;">${policy.policyType}</td>
        </tr>
        <tr>
          <td colspan="2" style="height: 1px; background: #e8eaed;"></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Carrier</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 14px; color: #191c1e;">${policy.carrier}</td>
        </tr>
        <tr>
          <td colspan="2" style="height: 1px; background: #e8eaed;"></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Renewal Date</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 14px; color: #191c1e;">${new Date(policy.expirationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
        </tr>
      </table>
    </div>
    
    ${daysUntilRenewal <= 30 ? `
    <div style="background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); padding: 20px 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ba1a1a;">
      <p style="margin: 0; font-size: 15px; color: #991b1b; font-weight: 600;">
        ⚠️ Action Required: Please review your renewal documents at your earliest convenience to ensure uninterrupted coverage.
      </p>
    </div>
    ` : ''}
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #44474c; line-height: 1.7;">
      Our team is prepared to help you review your coverage options. Whether you're looking to optimize your premiums or ensure you have comprehensive protection, we're here to assist.
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://retainvault.com'}/renewals/${policy.id}" 
             style="display: inline-block; background: linear-gradient(135deg, #006c49 0%, #008059 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(0,108,73,0.3);">
            Review Your Renewal →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; font-size: 15px; color: #44474c;">
      Thank you for your continued trust. We look forward to serving you in the coming year.
    </p>
    
    <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #e8eaed;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 4px; font-size: 13px; color: #191c1e; font-weight: 600;">Your Insurance Team</p>
            <p style="margin: 0; font-size: 12px; color: #74777d;">
              \u00A9 ${new Date().getFullYear()} RetainVault Insurance Technologies. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await sendEmailWithRetry(client.email, subject, html);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  } catch (error) {
    logger.error('Resend email error', error);
    return { success: false, error };
  }
}

export async function sendRateExplainerEmail(
  client: Client,
  policy: Policy,
  reportContent: string
) {
  if (!client.email) {
    return { success: false, error: 'No email' };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rate Increase Explanation</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #191c1e; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #041627; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">RetainVault</h1>
      <p style="color: #8192a7; margin: 8px 0 0; font-size: 14px;">AI-Powered Rate Analysis</p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e3e5; border-top: none; border-radius: 0 0 12px 12px;">
      <p style="margin: 0 0 20px; font-size: 16px;">Dear ${client.name},</p>
      
      <p style="margin: 0 0 20px; font-size: 16px;">
        We've prepared a detailed explanation of the premium changes for your 
        <strong>${policy.policyType}</strong> policy with <strong>${policy.carrier}</strong>.
      </p>
      
      <div style="background: #f7f9fb; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; font-size: 14px;">${reportContent}</div>
      
      <p style="margin: 0 0 20px; font-size: 16px;">
        Our team is available to discuss these changes and explore options that may help manage your insurance costs.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://retainvault.com'}/policies/${policy.id}"
           style="display: inline-block; background: #006c49; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          View Full Policy Details
        </a>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e3e5; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #74777d;">
          \u00A9 ${new Date().getFullYear()} RetainVault Insurance Technologies. All rights reserved.
        </p>
      </div>
    </div>
  </body>
</html>
`;

  try {
    const result = await sendEmailWithRetry(
      client.email,
      `Your ${policy.policyType} Rate Explanation - RetainVault AI Analysis`,
      html
    );
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  } catch (error) {
    logger.error('Resend email error', error);
    return { success: false, error };
  }
}

export async function sendTeamInvitationEmail(
  invitation: TeamInvitation
) {
  const roleLabels: Record<string, string> = {
    owner: 'Agency Owner',
    admin: 'Administrator',
    csr: 'Customer Service Representative',
    producer: 'Sales Producer',
  };

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://retainvault.com'}/invite/${invitation.token}`;
  const expiresInDays = Math.ceil((new Date(invitation.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #191c1e; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f7f9fb;">
  <div style="background: linear-gradient(135deg, #041627 0%, #0a2540 100%); padding: 40px 30px; border-radius: 20px 20px 0 0; text-align: center;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">RetainVault</h1>
          <p style="color: #8192a7; margin: 10px 0 0; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Team Invitation</p>
        </td>
      </tr>
    </table>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e8eaed; border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <p style="margin: 0 0 24px; font-size: 16px; color: #44474c;">
      ${invitation.name ? `Hello ${invitation.name},` : 'Hello,'}
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #44474c;">
      You've been invited to join <strong style="color: #191c1e;">${invitation.agencyName}</strong> on RetainVault as a <strong style="color: #006c49;">${roleLabels[invitation.role] || invitation.role}</strong>.
    </p>
    
    <div style="background: linear-gradient(135deg, #f7f9fb 0%, #ffffff 100%); padding: 24px; border-radius: 16px; margin: 28px 0; border: 1px solid #e8eaed;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Agency</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 14px; color: #191c1e;">${invitation.agencyName}</td>
        </tr>
        <tr>
          <td colspan="2" style="height: 1px; background: #e8eaed;"></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Role</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 14px; color: #006c49;">${roleLabels[invitation.role] || invitation.role}</td>
        </tr>
        <tr>
          <td colspan="2" style="height: 1px; background: #e8eaed;"></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #74777d; font-size: 14px; font-weight: 500;">Invitation Expires</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 14px; color: #191c1e;">In ${expiresInDays} days</td>
        </tr>
      </table>
    </div>
    
    <div style="background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); padding: 20px 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ba1a1a;">
      <p style="margin: 0; font-size: 15px; color: #991b1b; font-weight: 600;">
        ⏰ This invitation will expire in ${expiresInDays} days. Please accept before ${new Date(invitation.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
      </p>
    </div>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #44474c; line-height: 1.7;">
      RetainVault is a modern insurance agency management platform that helps teams manage clients, policies, and renewals efficiently. As a team member, you'll have access to powerful tools to serve your clients better.
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${acceptUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #006c49 0%, #008059 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(0,108,73,0.3);">
            Accept Invitation →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; font-size: 14px; color: #74777d; line-height: 1.7;">
      If you did not expect this invitation, you can safely ignore this email. No action is required.
    </p>
    
    <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #e8eaed;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 4px; font-size: 13px; color: #191c1e; font-weight: 600;">The ${invitation.agencyName} Team</p>
            <p style="margin: 0; font-size: 12px; color: #74777d;">
              \u00A9 ${new Date().getFullYear()} RetainVault Insurance Technologies. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await sendEmailWithRetry(
      invitation.email,
      `You're invited to join ${invitation.agencyName} on RetainVault`,
      html
    );
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  } catch (error) {
    logger.error('Resend email error', error);
    return { success: false, error };
  }
}

export async function sendWeeklyReportEmail(
  to: string,
  agencyName: string,
  stats: {
    totalPremium: number;
    renewalsUpcoming: number;
    policiesAtRisk: number;
    policiesCount: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Intelligence Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f7f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #006c49 0%, #008059 100%); padding: 40px 40px 32px;">
        <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #ffffff; font-style: italic;">Weekly Intelligence Report</h1>
        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8);">${agencyName} Command Center</p>
      </div>

      <!-- Content -->
      <div style="padding: 40px;">
        <p style="margin: 0 0 24px; font-size: 15px; color: #191c1e; line-height: 1.6;">
          Your weekly business intelligence summary is ready. Here's your agency's performance snapshot:
        </p>

        <!-- Stats Grid -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <tr>
            <td style="padding: 20px; background: #f6f7f9; border-radius: 16px; text-align: center; width: 50%;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #74777d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Book Value</p>
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #006c49;">$${stats.totalPremium.toLocaleString()}</p>
            </td>
            <td style="width: 16px;"></td>
            <td style="padding: 20px; background: #f6f7f9; border-radius: 16px; text-align: center; width: 50%;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #74777d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Active Policies</p>
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #191c1e;">${stats.policiesCount}</p>
            </td>
          </tr>
          <tr><td colspan="3" style="height: 16px;"></td></tr>
          <tr>
            <td style="padding: 20px; background: #fff4e5; border-radius: 16px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #74777d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">90-Day Renewals</p>
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #d97706;">${stats.renewalsUpcoming}</p>
            </td>
            <td style="width: 16px;"></td>
            <td style="padding: 20px; background: #fef2f2; border-radius: 16px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #74777d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">At Risk</p>
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #dc2626;">${stats.policiesAtRisk}</p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <div style="text-align: center; padding-top: 8px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #006c49 0%, #008059 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(0,108,73,0.3);">
            Open Command Center
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f6f7f9; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px; font-size: 13px; color: #191c1e; font-weight: 600;">The RetainVault Team</p>
        <p style="margin: 0; font-size: 12px; color: #74777d;">
          \u00A9 ${new Date().getFullYear()} RetainVault Insurance Technologies. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await sendEmailWithRetry(
      to,
      `Weekly Intelligence Report - ${agencyName}`,
      html
    );
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  } catch (error) {
    logger.error('Weekly report email error', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendTeamJoinEmail(
  to: string,
  data: { memberName: string; role: string }
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #006c49;">New Team Member Joined</h1>
      <p>Hello,</p>
      <p><strong>${data.memberName}</strong> has successfully joined your agency as a <strong>${data.role}</strong>.</p>
      <p>They now have access to the Command Center and can begin managing clients and policies.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/team" style="display: inline-block; background: #006c49; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Manage Team</a>
    </div>
  `;
  return sendEmailWithRetry(to, `New Team Member: ${data.memberName}`, html);
}

export async function sendCommissionEmail(
  to: string,
  data: { amount: number; date: Date }
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #006c49;">Commission Payment Processed</h1>
      <p>Hello,</p>
      <p>Your commission payment of <strong>$${data.amount.toLocaleString()}</strong> has been processed and is scheduled for <strong>${data.date.toLocaleDateString()}</strong>.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/commissions" style="display: inline-block; background: #006c49; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Statement</a>
    </div>
  `;
  return sendEmailWithRetry(to, `Commission Payment Processed - $${data.amount.toLocaleString()}`, html);
}

export async function sendInsuredReminderEmail(
  to: string,
  data: { policyNumber: string; clientName: string; daysOut: number }
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #006c49;">Policy Renewal Reminder</h1>
      <p>Dear ${data.clientName},</p>
      <p>Your policy <strong>${data.policyNumber}</strong> is set to renew in <strong>${data.daysOut} days</strong>.</p>
      <p>We want to ensure you have continuous coverage without any gaps. If you have any questions or would like to review your options, please reach out.</p>
      <p>Best regards,<br>Your Insurance Team</p>
    </div>
  `;
  return sendEmailWithRetry(to, `Renewal Reminder: Your policy renews in ${data.daysOut} days`, html);
}
