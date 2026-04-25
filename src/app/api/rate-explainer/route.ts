import { NextRequest, NextResponse } from 'next/server';
import { generateRateExplainer, getPolicyWithClient } from '@/lib/ai';
import { z } from 'zod';

const rateExplainerSchema = z.object({
  policyId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
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
    const data = await getPolicyWithClient(policyId);
    if (!data) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const { policy, client } = data;

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
    console.error('Rate explainer error:', error);
    return NextResponse.json(
      { error: 'Failed to generate rate explainer' },
      { status: 500 }
    );
  }
}
