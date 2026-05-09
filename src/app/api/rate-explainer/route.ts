import { NextRequest, NextResponse } from 'next/server';
import { generateRateExplainer, getPolicyWithClient } from '@/lib/ai';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withApiSecurity } from '@/lib/api-security';

const rateExplainerSchema = z.object({
  policyId: z.string().uuid(),
});

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const body = await request.json();
      
      // Validate input
      const validationResult = rateExplainerSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.issues },
          { status: 400 }
        );
      }
      
      const { policyId } = validationResult.data;

      // Get policy and client data
      const data = await getPolicyWithClient(policyId, context.agencyId!);
      if (!data) {
        return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      }

      const { policy, client } = data;

      // Verify ownership
      if (policy.agencyId !== context.agencyId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Generate rate explainer
      const result = await generateRateExplainer(policy, client);

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
      logger.error('Rate explainer error', error);
      return NextResponse.json(
        { error: 'Failed to generate rate explainer' },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
  }
);
