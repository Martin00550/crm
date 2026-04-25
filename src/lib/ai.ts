import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { canUseFeature, incrementFeatureUsage } from '@/lib/feature-access';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateAIPrompt } from '@/lib/validation';

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface RateExplainerInput {
  policyNumber: string;
  carrier: string;
  policyType: string;
  previousPremium: string;
  currentPremium: string;
  clientName: string;
  industry: string;
  reason?: string;
}

export async function generateRateExplainer(
  policy: Policy,
  client: Client
): Promise<{ success: boolean; report?: string; error?: string; usage?: { current: number; limit: number } }> {
  // Check rate limit first (per agency)
  const rateLimit = await checkRateLimit(policy.agencyId, 'aiGeneration');
  if (!rateLimit.success) {
    return {
      success: false,
      error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)} seconds.`,
    };
  }
  
  // Check feature access
  const accessCheck = await canUseFeature(policy.agencyId, 'aiRateForensics');
  
  if (!accessCheck.allowed) {
    return {
      success: false,
      error: accessCheck.reason || 'AI Rate Forensics not available',
      usage: accessCheck.limit ? { current: accessCheck.currentUsage || 0, limit: accessCheck.limit } : undefined,
    };
  }

  // Validate inputs to prevent injection
  const policyNumberValidation = validateAIPrompt(policy.policyNumber);
  const carrierValidation = validateAIPrompt(policy.carrier);
  const policyTypeValidation = validateAIPrompt(policy.policyType);
  const clientNameValidation = validateAIPrompt(client.name);
  const industryValidation = validateAIPrompt(client.industry || '');
  
  if (!policyNumberValidation.valid || !carrierValidation.valid || 
      !policyTypeValidation.valid || !clientNameValidation.valid) {
    return {
      success: false,
      error: 'Invalid input data',
    };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const previousPremium = parseFloat(policy.previousTermPremium || '0');
  const currentPremium = parseFloat(policy.currentTermPremium || policy.premium);
  const percentChange = previousPremium > 0 
    ? (((currentPremium - previousPremium) / previousPremium) * 100).toFixed(1)
    : '0';

  const prompt = `You are an insurance expert explaining a premium rate increase to a commercial client. 

Policy Details:
- Policy Number: ${policy.policyNumber}
- Carrier: ${policy.carrier}
- Policy Type: ${policy.policyType}
- Client: ${client.name}
- Industry: ${client.industry || 'Not specified'}

Premium Information:
- Previous Term Premium: $${previousPremium.toLocaleString()}
- Current Term Premium: $${currentPremium.toLocaleString()}
- Change: ${percentChange}%

Create a concise, professional 1-page visual explanation (in Markdown format) that:
1. Clearly explains WHY the premium changed (be specific about factors like market conditions, loss history, industry trends, etc.)
2. Provides 1-2 actionable recommendations to help reduce costs or maintain coverage
3. Uses professional but accessible language (avoid jargon)
4. Is suitable for a business owner who may not be insurance experts

Format the response as a clean, structured document with these sections:
- Executive Summary
- Key Factors Contributing to Your Premium
- Recommendations for This Renewal Period
- Next Steps

Keep it under 400 words total. Be specific and actionable.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Increment usage after successful generation
    await incrementFeatureUsage(policy.agencyId, 'aiRateForensics');
    
    return {
      success: true,
      report: response,
      usage: accessCheck.limit ? { current: (accessCheck.currentUsage || 0) + 1, limit: accessCheck.limit } : undefined,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      error: 'AI service temporarily unavailable. Please try again in a few moments.',
    };
  }
}

export async function getPolicyWithClient(policyId: string) {
  const policy = await db
    .select()
    .from(policies)
    .where(eq(policies.id, policyId))
    .then((p: any[]) => p[0]);

  if (!policy) return null;

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, policy.clientId))
    .then((c: any[]) => c[0]);

  return { policy, client };
}
