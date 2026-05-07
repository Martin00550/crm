import { db } from '@/lib/db';
import { policies, clients, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
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

/**
 * Call Gemini 1.5 Flash (requested as Gemini 3.1 Flash Lite) via Google AI
 */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Using gemini-3.1-flash-lite as requested
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: 'You are a high-authority Insurance Analysis Expert.' }]
      },
      contents: [
        { 
          parts: [{ text: prompt }] 
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response format from Gemini API');
  }
  
  return data.candidates[0].content.parts[0].text;
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
  const accessCheck = await canUseFeature(policy.agencyId, 'aiRateAnalysis');
  
  if (!accessCheck.allowed) {
    return {
      success: false,
      error: accessCheck.reason || 'AI Rate Analysis not available',
      usage: accessCheck.limit ? { current: accessCheck.currentUsage || 0, limit: accessCheck.limit } : undefined,
    };
  }

  // Validate inputs
  const policyNumberValidation = validateAIPrompt(policy.policyNumber);
  const carrierValidation = validateAIPrompt(policy.carrier);
  const policyTypeValidation = validateAIPrompt(policy.policyType);
  const clientNameValidation = validateAIPrompt(client.name);
  
  if (!policyNumberValidation.valid || !carrierValidation.valid || 
      !policyTypeValidation.valid || !clientNameValidation.valid) {
    return {
      success: false,
      error: 'Invalid input data',
    };
  }

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
    const report = await callGemini(prompt);
    
    // Increment usage after successful generation
    await incrementFeatureUsage(policy.agencyId, 'aiRateAnalysis');
    
    return {
      success: true,
      report,
      usage: accessCheck.limit ? { current: (accessCheck.currentUsage || 0) + 1, limit: accessCheck.limit } : undefined,
    };
  } catch (error) {
    logger.error('Gemini API error', error);
    return {
      success: false,
      error: 'Gemini AI service temporarily unavailable. Please try again in a few moments.',
    };
  }
}

export async function getPolicyWithClient(policyId: string) {
  if (!db) return null;
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

/**
 * Generate a comprehensive AI analysis report for a client's entire portfolio
 */
export async function generateClientReport(
  clientId: string,
  agencyId: string
): Promise<{ success: boolean; report?: string; error?: string; usage?: { current: number; limit: number } }> {
  if (!db) return { success: false, error: 'Database not connected' };

  // 1. Check feature access
  const accessCheck = await canUseFeature(agencyId, 'aiRateAnalysis');
  if (!accessCheck.allowed) {
    return {
      success: false,
      error: accessCheck.reason || 'AI Analysis not available',
      usage: accessCheck.limit ? { current: accessCheck.currentUsage || 0, limit: accessCheck.limit } : undefined,
    };
  }

  // 2. Gather Data
  const client = await db.select().from(clients).where(eq(clients.id, clientId)).then(r => r[0]);
  if (!client || client.agencyId !== agencyId) {
    return { success: false, error: 'Client not found or unauthorized' };
  }

  const clientPolicies = await db.select().from(policies).where(eq(policies.clientId, clientId)).execute();
  
  if (clientPolicies.length === 0) {
    return { success: false, error: 'No policies found for this client to analyze.' };
  }

  // 3. Construct Prompt
  const totalPremium = clientPolicies.reduce((sum, p) => sum + parseFloat(p.premium || '0'), 0);
  const avgHealth = clientPolicies.reduce((sum, p) => sum + (p.healthScore || 100), 0) / clientPolicies.length;
  
  const policyData = clientPolicies.map(p => ({
    number: p.policyNumber,
    carrier: p.carrier,
    type: p.policyType,
    premium: p.premium,
    expiry: p.expirationDate,
    health: p.healthScore
  }));

  const prompt = `You are a high-authority Senior Risk Analyst. Analyze the insurance portfolio for ${client.name}.

Client Context:
- Industry: ${client.industry || 'General Business'}
- Total Active Premium: $${totalPremium.toLocaleString()}
- Average Portfolio Health: ${avgHealth.toFixed(1)}/100

Portfolio Data:
${JSON.stringify(policyData, null, 2)}

Task:
Create a comprehensive Strategic Client Intelligence Report in Markdown.
1. Executive Summary: High-level overview of coverage health.
2. Risk Concentration: Identify any carriers or coverage types that present high risk.
3. Coverage Gaps: Suggest if they are missing critical lines (e.g. Cyber, D&O) based on their industry.
4. Retention Strategy: 3 specific actions for the agency owner to ensure this client renews.

Tone: Professional, clinical, high-authority.
Constraints: Max 600 words. Use structured headers and tables where appropriate.`;

  try {
    const report = await callGemini(prompt);
    
    // 4. Increment usage
    await incrementFeatureUsage(agencyId, 'aiRateAnalysis');
    
    return {
      success: true,
      report,
      usage: accessCheck.limit ? { current: (accessCheck.currentUsage || 0) + 1, limit: accessCheck.limit } : undefined,
    };
  } catch (error) {
    logger.error('Client report generation error', error);
    return {
      success: false,
      error: 'AI Analysis engine failed to respond. Please try again.',
    };
  }
}
