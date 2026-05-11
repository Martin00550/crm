import { NextRequest, NextResponse } from 'next/server';
import { generateClientReport } from '@/lib/ai';
import { withApiSecurity } from '@/lib/api-security';
import { logger } from '@/lib/logger';

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { params } = context as any;
    const clientId = params?.id;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    try {
      const result = await generateClientReport(clientId, context.agencyId!);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, usage: result.usage },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        report: result.report,
        usage: result.usage,
      });
    } catch (error) {
      logger.error('Client AI report API error', error);
      return NextResponse.json(
        { error: 'An error occurred while generating the report. Please try again.' },
        { status: 200 }
      );
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'aiGeneration',
    auditAction: 'ai.client_report',
  }
);
