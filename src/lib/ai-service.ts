/**
 * AI Service for intelligence reports and rate explanations
 */

import { db } from '@/lib/db';
import { policies } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a conversational explanation for a rate change
 */
export async function generateRateExplanation(policyId: string) {
  if (!db) return "Rate explanation service currently unavailable.";

  try {
    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .then((r: any[]) => r[0]);

    if (!policy) return "Policy details not found.";

    // Mock AI logic - in production this would call OpenAI/Anthropic
    const premium = parseFloat(policy.premium as string || "0");
    const previousPremium = parseFloat((policy as any).previousTermPremium as string || "0");
    
    if (previousPremium && premium > previousPremium) {
      const increase = ((premium - previousPremium) / previousPremium) * 100;
      return `This ${increase.toFixed(1)}% rate adjustment is primarily driven by general carrier rate filings and increased claims volume for ${policy.policyType} policies in your region.`;
    }

    return "Current premium remains competitive for this policy type and carrier.";
  } catch (error) {
    console.error('Error generating rate explanation:', error);
    return "Unable to generate explanation at this time.";
  }
}
