/**
 * AI Service for intelligence reports and rate explanations
 */

import { db } from '@/lib/db';
import { policies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';



/**
 * Generate a conversational explanation for a rate change using Gemini 1.5 Flash
 */
export async function generateRateExplanation(policyId: string) {
  if (!db) return "Rate explanation service currently unavailable.";

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    logger.warn('GEMINI_API_KEY not configured. Falling back to mock logic.');
    return generateMockRateExplanation(policyId);
  }

  try {
    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .then((r: any[]) => r[0]);

    if (!policy) return "Policy details not found.";

    const premium = parseFloat(policy.premium as string || "0");
    const previousPremium = parseFloat((policy as any).previousTermPremium as string || "0");
    const premiumChange = previousPremium ? ((premium - previousPremium) / previousPremium) * 100 : 0;

    const prompt = `You are a high-end insurance agency operations expert.
    Analyze this premium change and provide a concise, professional explanation an agency owner can use with their client.
    
    POLICY DATA:
    Type: ${policy.policyType}
    Carrier: ${policy.carrier}
    Current Premium: $${premium.toLocaleString()}
    Previous Premium: $${previousPremium.toLocaleString()}
    Change: ${premiumChange.toFixed(1)}%
    
    TONE: Quiet, authoritative, professional, and helpful (Quiet Operations style).
    CONTEXT: Hard market. Carriers are raising rates.
    MAX LENGTH: 2 sentences.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`, {
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
          temperature: 0.3,
          maxOutputTokens: 256,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    logger.error('Error generating AI rate explanation', error);
    return 'An error occurred while generating the report. Please try again.';
  }
}

/**
 * Fallback mock logic for rate explanation
 */
async function generateMockRateExplanation(policyId: string) {
  try {
    const policy = await db
      ?.select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .then((r: any[]) => r[0]);

    if (!policy) return "Policy details not found.";

    const premium = parseFloat(policy.premium as string || "0");
    const previousPremium = parseFloat((policy as any).previousTermPremium as string || "0");
    
    if (previousPremium && premium > previousPremium) {
      const increase = ((premium - previousPremium) / previousPremium) * 100;
      return `This ${increase.toFixed(1)}% rate adjustment is primarily driven by general carrier rate filings and increased claims volume for ${policy.policyType} policies in your region.`;
    }

    return "Current premium remains competitive for this policy type and carrier.";
  } catch (error) {
    logger.error('Error generating mock rate explanation', error);
    return "Unable to generate explanation at this time.";
  }
}
