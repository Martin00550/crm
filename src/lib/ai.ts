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
 * Call Gemini 3.1 Flash Lite via Google AI with Persona Support
 */
async function callGemini(prompt: string, systemInstruction: string = 'You are a high-authority Insurance Analysis Expert.'): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s enterprise timeout

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          { 
            parts: [{ text: prompt }] 
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.85,
          topK: 40,
          maxOutputTokens: 2048,
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
  } finally {
    clearTimeout(timeoutId);
  }
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
      error: 'An error occurred while generating the report. Please try again.',
    };
  }
}

import { withAgencyContext } from '@/lib/db-rls';

/**
 * Get a policy and its associated client, enforcing RLS context
 */
export async function getPolicyWithClient(policyId: string, agencyId: string) {
  return withAgencyContext(agencyId, async (tx) => {
    const policy = await tx
      .select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .then((p: any[]) => p[0]);

    if (!policy) return null;

    const client = await tx
      .select()
      .from(clients)
      .where(eq(clients.id, policy.clientId))
      .then((c: any[]) => c[0]);

    return { policy, client };
  });
}

/**
 * Generate a comprehensive AI analysis report for a client's entire portfolio
 */
export async function generateClientReport(
  clientId: string,
  agencyId: string
): Promise<{ success: boolean; report?: string; error?: string; usage?: { current: number; limit: number } }> {
  // 1. Check feature access
  const accessCheck = await canUseFeature(agencyId, 'aiRateAnalysis');
  if (!accessCheck.allowed) {
    return {
      success: false,
      error: accessCheck.reason || 'AI Analysis not available',
      usage: accessCheck.limit ? { current: accessCheck.currentUsage || 0, limit: accessCheck.limit } : undefined,
    };
  }

  // 2. Gather Data within RLS Context
  const data = await withAgencyContext(agencyId, async (tx) => {
    const client = await tx.select().from(clients).where(eq(clients.id, clientId)).then((r: any[]) => r[0]);
    if (!client) return null;

    const clientPolicies = await tx.select().from(policies).where(eq(policies.clientId, clientId)).execute();
    return { client, clientPolicies };
  });

  if (!data) {
    return { success: false, error: 'Client not found or unauthorized' };
  }

  const { client, clientPolicies } = data;
  
  if (clientPolicies.length === 0) {
    return { success: false, error: 'No policies found for this client to analyze.' };
  }

  const totalPremium = clientPolicies.reduce((sum: number, p: any) => sum + parseFloat(p.premium || '0'), 0);
  const avgHealth = clientPolicies.reduce((sum: number, p: any) => sum + (p.healthScore || 100), 0) / clientPolicies.length;
  
  const policyData = clientPolicies.map((p: any) => ({
    number: p.policyNumber,
    carrier: p.carrier,
    type: p.policyType,
    premium: p.premium,
    expiry: p.expirationDate,
    health: p.healthScore
  }));

  try {
    // PHASE 1: INITIAL DRAFT (Senior Analyst Persona)
    const draftPrompt = `Analyze the insurance portfolio for ${client.name}.
Industry: ${client.industry || 'General Business'}
Total Premium: $${totalPremium.toLocaleString()}
Avg Health: ${avgHealth.toFixed(1)}/100
Data: ${JSON.stringify(policyData, null, 2)}

Create a Strategic Client Intelligence Report in Markdown.
Sections: Executive Summary, Risk Concentration, Coverage Gaps, Retention Strategy.
Tone: Professional, high-authority. Max 500 words.`;

    const initialDraft = await callGemini(draftPrompt, 'You are a Senior Insurance Risk Analyst. Focus on data-driven insights and technical accuracy.');

    // PHASE 2: CRITIQUE (Institutional Reviewer Persona)
    const critiquePrompt = `Review the following insurance report for ${client.name}. 
Identify any logical inconsistencies, missing industry-specific risks for the ${client.industry || 'specified'} sector, or areas where the tone isn't clinical/authoritative enough.
Point out specifically where the "Retention Strategy" could be more aggressive or professional.

REPORT TO CRITIQUE:
${initialDraft}`;

    const critique = await callGemini(critiquePrompt, 'You are a Chief Underwriting Officer. You are extremely critical, picky about jargon, and demand absolute professional perfection.');

    // PHASE 3: REFINEMENT (Refinement Expert Persona)
    const refinementPrompt = `Refine the initial insurance report based on the CUO's critique.
Produce a final, polished version in Markdown that incorporates the improvements while maintaining a lean, high-authority structure.

INITIAL REPORT:
${initialDraft}

CUO CRITIQUE:
${critique}`;

    const finalReport = await callGemini(refinementPrompt, 'You are a Refinement Specialist. Your goal is to combine raw insights with expert critiques into a single, flawless, institutional-grade document.');

    // 4. Increment usage
    await incrementFeatureUsage(agencyId, 'aiRateAnalysis');
    
    return {
      success: true,
      report: finalReport,
      usage: accessCheck.limit ? { current: (accessCheck.currentUsage || 0) + 1, limit: accessCheck.limit } : undefined,
    };
  } catch (error) {
    logger.error('Client report generation error', error);
    return {
      success: false,
      error: 'An error occurred while generating the report. Please try again.',
    };
  }
}
