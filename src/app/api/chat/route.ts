import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface AIResponse {
  choices: {
    message: ChatMessage;
  }[];
}

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clients, policies, users } from '@/db/schema';
import { eq, and, gte, lte, ilike, or, asc, inArray, sql } from 'drizzle-orm';
import { buildAgencyContext } from '@/lib/ai-context';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use database-backed rate limiting, not in-memory
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

async function checkRateLimit(userId: string): Promise<boolean> {
  if (!db) return false;
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  
  // Count requests in the time window
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM ai_chat_logs WHERE user_id = ${userId} AND created_at > ${windowStart.toISOString()}`
  );


  
  const count = parseInt((result as any)?.count || '0', 10);
  return count < RATE_LIMIT_MAX;
}

async function logChatRequest(userId: string, messageCount: number) {
  if (!db) return;
  await db.execute(
    sql`INSERT INTO ai_chat_logs (user_id, message_count, created_at) VALUES (${userId}, ${messageCount}, NOW())`
  );
}

async function getAgencyId(id: string) {
  if (!db) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return user?.agencyId || null;
}

async function callDashScope(messages: ChatMessage[], tools: any[]): Promise<AIResponse> {
  const response = await fetch('https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen2.5-72b-instruct',
      messages,
      tools: tools.length > 0 ? tools : undefined,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DashScope API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  // Validate response structure
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error('Invalid response format from DashScope API');
  }
  if (!data.choices[0].message) {
    throw new Error('Missing message in DashScope API response');
  }
  
  return data;
}

async function callGemini(messages: ChatMessage[], tools: any[]): Promise<AIResponse> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Convert messages to Gemini format
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : m.role,
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContent({
    contents: geminiMessages,
    tools: tools.length > 0 ? tools : undefined,
  });

  const response = await result.response;
  
  // Check if response was blocked by safety filters
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    throw new Error('Response blocked by AI safety filters. Please try a different query.');
  }

  const text = response.text();
  if (!text) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  return {
    choices: [{
      message: {
        role: 'assistant',
        content: text,
      },
    }],
  };
}

async function callAI(messages: ChatMessage[], tools: any[]): Promise<AIResponse> {
  // Try DashScope first if available
  if (process.env.DASHSCOPE_API_KEY) {
    try {
      return await callDashScope(messages, tools);
    } catch (error) {
      console.warn('DashScope failed, falling back to Gemini:', error);
    }
  }
  
  // Fall back to Gemini
  if (process.env.GEMINI_API_KEY) {
    return await callGemini(messages, tools);
  }
  
  throw new Error('No AI provider configured. Please add DASHSCOPE_API_KEY or GEMINI_API_KEY to .env');
}

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_clients',
      description: 'Search for clients by name, email, industry, or other criteria',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term to match against client name, email, or industry' },
          status: { type: 'string', enum: ['all', 'active', 'at-risk'], description: 'Filter by client health status' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_policy',
      description: 'Get detailed information about a specific policy',
      parameters: {
        type: 'object',
        properties: {
          policyNumber: { type: 'string', description: 'Policy number or identifier' },
          clientName: { type: 'string', description: 'Client name to help find the policy' },
        },
        required: ['policyNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_renewal_pipeline',
      description: 'Get upcoming policy renewals within a specific timeframe',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days ahead to check (e.g., 30, 60, 90)' },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analytics',
      description: 'Get portfolio analytics and business metrics',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: ['overview', 'carriers', 'top_clients', 'at_risk'], description: 'Which analytics metric to retrieve' },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_policy_premium',
      description: 'Update the premium amount for a specific policy',
      parameters: {
        type: 'object',
        properties: {
          policyNumber: { type: 'string', description: 'Policy number to update' },
          newPremium: { type: 'number', description: 'New premium amount (e.g., 15000)' },
        },
        required: ['policyNumber', 'newPremium'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_client_info',
      description: 'Update client information such as name, email, phone, or industry',
      parameters: {
        type: 'object',
        properties: {
          clientId: { type: 'string', description: 'Client ID to update' },
          name: { type: 'string', description: 'New client name' },
          email: { type: 'string', description: 'New email address' },
          phone: { type: 'string', description: 'New phone number' },
          industry: { type: 'string', description: 'New industry' },
        },
        required: ['clientId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_policy_status',
      description: 'Update a policy status to active, expired, or cancelled',
      parameters: {
        type: 'object',
        properties: {
          policyNumber: { type: 'string', description: 'Policy number to update' },
          newStatus: { type: 'string', enum: ['active', 'expired', 'cancelled'], description: 'New policy status' },
        },
        required: ['policyNumber', 'newStatus'],
      },
    },
  },
];

import { mockClients, mockPolicies } from '@/lib/mock-data-server';

async function executeTool(toolName: string, args: any, agencyId: string, userId: string | null): Promise<any> {
  const isDemo = agencyId === 'demo-agency';

  switch (toolName) {
    case 'search_clients': {
      if (isDemo) {
        const results = mockClients.filter(c => 
          c.name.toLowerCase().includes(args.query.toLowerCase()) ||
          c.email.toLowerCase().includes(args.query.toLowerCase()) ||
          c.industry.toLowerCase().includes(args.query.toLowerCase())
        );
        return { clients: results, count: results.length };
      }
      if (!db) return { clients: [], count: 0, error: 'Database not connected' };
      const results = await db.query.clients.findMany({
        where: and(
          eq(clients.agencyId, agencyId),
          or(
            ilike(clients.name, `%${args.query}%`),
            ilike(clients.email, `%${args.query}%`),
            ilike(clients.industry, `%${args.query}%`),
          ),
        ),
        limit: 10,
      });
      // Fetch all policies for these clients in ONE query
      const clientIds = results.map((c: any) => c.id);
      const allPolicies = clientIds.length > 0
        ? await db.query.policies.findMany({
            where: and(inArray(policies.clientId, clientIds), eq(policies.agencyId, agencyId)),
          })
        : [];
      // Group policies by clientId in memory
      const policiesByClient = new Map<string, any[]>();
      allPolicies.forEach((p: any) => {
        const existing = policiesByClient.get(p.clientId) || [];
        existing.push(p);
        policiesByClient.set(p.clientId, existing);
      });
      const enriched = results.map((client: any) => {
        const clientPolicies = policiesByClient.get(client.id) || [];
        const totalPremium = clientPolicies.reduce((s: number, p: any) => s + parseFloat(p.premium || '0'), 0);
        return { ...client, policyCount: clientPolicies.length, totalPremium };
      });
      return { clients: enriched, count: enriched.length };
    }
    case 'get_policy': {
      if (isDemo) {
        const results = mockPolicies.filter(p => 
          p.policyNumber.toLowerCase().includes(args.policyNumber.toLowerCase())
        );
        return { policies: results.map(p => ({ ...p, daysUntilExpiration: Math.ceil((new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) })) };
      }
      if (!db) return { policies: [], error: 'Database not connected' };
      const results = await db.query.policies.findMany({
        where: and(
          eq(policies.agencyId, agencyId),
          ilike(policies.policyNumber, `%${args.policyNumber}%`),
        ),
        limit: 5,
      });
      // Fetch all clients for these policies in ONE query
      const clientIds = Array.from(new Set<string>(results.map((p: any) => p.clientId as string)));
      const allClients = clientIds.length > 0
        ? await db.query.clients.findMany({
            where: inArray(clients.id, clientIds),
          })
        : [];
      const clientMap = new Map<string, any>();
      allClients.forEach((c: any) => clientMap.set(c.id, c));
      const enriched = results.map((policy: any) => {
        const client = clientMap.get(policy.clientId);
        return { ...policy, clientName: client?.name, daysUntilExpiration: Math.ceil((new Date(policy.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) };
      });
      return { policies: enriched };
    }
    case 'get_renewal_pipeline': {
      if (isDemo) {
        const today = new Date();
        const future = new Date(today.getTime() + args.days * 24 * 60 * 60 * 1000);
        const results = mockPolicies.filter(p => 
          new Date(p.expirationDate) >= today && 
          new Date(p.expirationDate) <= future &&
          p.status === 'active'
        ).map(p => ({
          ...p,
          premium: p.premium,
          daysUntil: Math.ceil((new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        }));
        return { renewals: results, total: results.length, totalPremium: results.reduce((s, r) => s + r.premium, 0) };
      }
      if (!db) return { renewals: [], total: 0, totalPremium: 0, error: 'Database not connected' };
      const today = new Date();
      const future = new Date(today.getTime() + args.days * 24 * 60 * 60 * 1000);
      const upcomingPolicies = await db.query.policies.findMany({
        where: and(
          eq(policies.agencyId, agencyId),
          gte(policies.expirationDate, today),
          lte(policies.expirationDate, future),
          eq(policies.status, 'active'),
        ),
        orderBy: [asc(policies.expirationDate)],
      });
      // Fetch all clients for these policies in ONE query
      const clientIds = Array.from(new Set<string>(upcomingPolicies.map((p: any) => p.clientId as string)));
      const allClients = clientIds.length > 0
        ? await db.query.clients.findMany({
            where: inArray(clients.id, clientIds),
          })
        : [];
      const clientMap = new Map<string, any>();
      allClients.forEach((c: any) => clientMap.set(c.id, c));
      const enriched = upcomingPolicies.map((p: any) => {
        const client = clientMap.get(p.clientId);
        return {
          policyNumber: p.policyNumber,
          carrier: p.carrier,
          policyType: p.policyType,
          premium: parseFloat(p.premium),
          expirationDate: p.expirationDate,
          daysUntil: Math.ceil((new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          healthScore: p.healthScore,
          healthStatus: p.healthStatus,
          clientName: client?.name,
        };
      });
      return { renewals: enriched, total: enriched.length, totalPremium: enriched.reduce((s: number, r: any) => s + r.premium, 0) };
    }
    case 'get_analytics': {
      if (isDemo) {
        if (args.metric === 'overview') {
          const totalPremium = mockPolicies.reduce((s, p) => s + p.premium, 0);
          return {
            totalClients: mockClients.length,
            activePolicies: mockPolicies.length,
            totalPremium,
            avgPremiumPerClient: totalPremium / mockClients.length,
            commission: totalPremium * 0.15,
          };
        }
        if (args.metric === 'at_risk') {
          const results = mockPolicies.filter(p => p.healthStatus === 'at-risk').map(p => ({
            ...p,
            daysUntilExpiration: Math.ceil((new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          }));
          return { atRiskPolicies: results, count: results.length };
        }
        return { error: 'Metric not fully mocked in demo' };
      }
      if (!db) return { error: 'Database not connected' };
      const allPolicies = await db.query.policies.findMany({
        where: eq(policies.agencyId, agencyId),
      });
      const allClients = await db.query.clients.findMany({
        where: eq(clients.agencyId, agencyId),
      });

      if (args.metric === 'overview') {
        const totalPremium = allPolicies.reduce((s: number, p: any) => s + parseFloat(p.premium || '0'), 0);
        return {
          totalClients: allClients.length,
          activePolicies: allPolicies.filter((p: any) => p.status === 'active').length,
          totalPremium,
          avgPremiumPerClient: allClients.length ? totalPremium / allClients.length : 0,
          commission: totalPremium * 0.15,
        };
      }
      if (args.metric === 'carriers') {
        const carrierMap = new Map<string, { count: number; premium: number }>();
        allPolicies.forEach((p: any) => {
          const e = carrierMap.get(p.carrier) || { count: 0, premium: 0 };
          e.count++;
          e.premium += parseFloat(p.premium || '0');
          carrierMap.set(p.carrier, e);
        });
        return { carriers: Array.from(carrierMap.entries()).map(([name, d]) => ({ name, ...d })) };
      }
      if (args.metric === 'top_clients') {
        const clientData = allClients.map((c: any) => {
          const cp = allPolicies.filter((p: any) => p.clientId === c.id);
          return { name: c.name, premium: cp.reduce((s: number, p: any) => s + parseFloat(p.premium || '0'), 0), policies: cp.length };
        }).sort((a: any, b: any) => b.premium - a.premium).slice(0, 10);
        return { topClients: clientData };
      }
      if (args.metric === 'at_risk') {
        const atRisk = allPolicies.filter((p: any) => p.healthStatus === 'at-risk');
        // Fetch all clients for at-risk policies in ONE query
        const atRiskClientIds = Array.from(new Set<string>(atRisk.map((p: any) => p.clientId as string)));
        const atRiskClients = atRiskClientIds.length > 0
          ? await db.query.clients.findMany({
              where: inArray(clients.id, atRiskClientIds),
            })
          : [];
        const atRiskClientMap = new Map<string, any>();
        atRiskClients.forEach((c: any) => atRiskClientMap.set(c.id, c));
        const enriched = atRisk.map((p: any) => {
          const client = atRiskClientMap.get(p.clientId);
          return { policyNumber: p.policyNumber, clientName: client?.name, healthScore: p.healthScore, premium: parseFloat(p.premium), daysUntilExpiration: Math.ceil((new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) };
        });
        return { atRiskPolicies: enriched, count: enriched.length };
      }
      return { error: 'Unknown metric' };
    }
    case 'update_policy_premium': {
      if (!db) return { error: 'Database not connected' };
      if (!userId) return { error: 'Authentication required for write operations' };
      const policy = await db.query.policies.findFirst({
        where: and(eq(policies.agencyId, agencyId), eq(policies.policyNumber, args.policyNumber)),
      });
      if (!policy) return { error: `Policy ${args.policyNumber} not found` };
      const oldPremium = policy.premium;
      await db.update(policies)
        .set({ premium: String(args.newPremium), updatedAt: new Date() })
        .where(eq(policies.id, policy.id));
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/clients');
      return { success: true, policyNumber: args.policyNumber, oldPremium, newPremium: args.newPremium };
    }
    case 'update_client_info': {
      if (!db) return { error: 'Database not connected' };
      if (!userId) return { error: 'Authentication required for write operations' };
      const client = await db.query.clients.findFirst({
        where: and(eq(clients.agencyId, agencyId), eq(clients.id, args.clientId)),
      });
      if (!client) return { error: `Client ${args.clientId} not found` };
      const updates: any = { updatedAt: new Date() };
      if (args.name) updates.name = args.name;
      if (args.email) updates.email = args.email;
      if (args.phone) updates.phone = args.phone;
      if (args.industry) updates.industry = args.industry;
      await db.update(clients).set(updates).where(eq(clients.id, client.id));
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/clients');
      return { success: true, clientId: args.clientId, updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt') };
    }
    case 'update_policy_status': {
      if (!db) return { error: 'Database not connected' };
      if (!userId) return { error: 'Authentication required for write operations' };
      const policy = await db.query.policies.findFirst({
        where: and(eq(policies.agencyId, agencyId), eq(policies.policyNumber, args.policyNumber)),
      });
      if (!policy) return { error: `Policy ${args.policyNumber} not found` };
      const oldStatus = policy.status;
      await db.update(policies)
        .set({ status: args.newStatus, updatedAt: new Date() })
        .where(eq(policies.id, policy.id));
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/clients');
      return { success: true, policyNumber: args.policyNumber, oldStatus, newStatus: args.newStatus };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

import { withApiSecurity } from '@/lib/api-security';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface AIResponse {
  choices: {
    message: ChatMessage;
  }[];
}
export const POST = withApiSecurity(
  async (req: NextRequest, context) => {
    const { userId, agencyId } = context;

    if (!userId || !agencyId) {
      return NextResponse.json({ 
        error: 'Unauthorized or Agency not found' 
      }, { status: 401 });
    }

    // Rate limiting check (per user, not IP) - Skip for demo users
    const isDemo = agencyId === 'demo-agency';
    if (!isDemo) {
      const rateLimitAllowed = await checkRateLimit(userId);
      if (!rateLimitAllowed) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again in 1 minute.' 
        }, { status: 429 });
      }
    }

    let contextSummary = '';

    if (db) {
      const authContext = await buildAgencyContext(userId);
      if (authContext) {
        contextSummary = `AGENCY: ${authContext.agencyName} (${authContext.subscriptionTier} tier)
CLIENTS: ${authContext.totalClients} total, ${authContext.activePolicies} active policies
PREMIUM: $${authContext.totalPremium.toLocaleString()} total, $${authContext.totalCommission.toLocaleString()} commission
RENEWALS: ${authContext.upcomingRenewals30} in 30d, ${authContext.upcomingRenewals60} in 60d, ${authContext.upcomingRenewals90} in 90d
HEALTH: ${authContext.atRiskPolicies} policies at risk`;
      }
    }

    // Log the request - Skip for demo
    const { messages } = await req.json();
    if (!isDemo) {
      await logChatRequest(userId, messages.length);
    }

    const systemMessage = {
      role: 'system',
      content: `You are RetainVault Intelligence Protocol, the automated Chief Operating Officer for this high-ticket Independent Insurance Agency. Your sole objective is to protect the Agency's Book of Business from policy leakage and ensure a 100% retention rate.

VOCABULARY PROTOCOL (MANDATORY):
- Never say "Users" or "Leads" -> Say "Prospects" or "Insureds"
- Never say "MRR/ARR" -> Say "Book of Business" or "Total Premium Volume"
- Never say "Churn" -> Say "Policy Leakage" or "Lapsed Policies"
- Never say "Upsell" -> Say "Cross-sell" or "Rounding out the account"
- Never say "Sales Pipeline" -> Say "Renewal Pipeline" or "Submission Tracker"
- Never say "Support" -> Say "Servicing" or "Endorsements"

TONE & STYLE:
- Authoritative but Servile: You are the quiet, highly-paid COO handling the messy data so the Agent can look like a hero.
- No "Tech Startup" jargon (e.g., no "synergy", "onboarding", "success").
- No playful language: No emojis, no "Woohoo", no "Yay". Use serious, institutional words: "Secure", "Analyze", "Retain", "Command".
- Lead with the insight: "87 days until expiration for Tech Corp. Health score is Red due to a 14% rate hike."
- Short, dense, and professional.

"HARD MARKET" INTELLIGENCE:
- You understand the "Hard Market" (skyrocketing rates).
- Your analysis should help the agent explain rate hikes to insureds without being the "bad guy".
- Focus on "Rate Forensics" to justify premiums.

RESPONSE FORMAT RULES:
- Never use markdown tables or decorative formatting.
- Use plain numbers with dollar signs (e.g., $23,500).
- Keep responses under 120 words.
- Act as a command center, not a chat bot. Give results directly.

YOUR CAPABILITIES:
- Search and retrieve client records
- Analyze policy details and health scores
- Track renewal pipelines and deadlines
- Generate portfolio analytics
- Update policy premiums, status, and client information
- Draft client communications
- Answer any question about the CRM

CONTEXT - Current Agency State:
${contextSummary}

If the user asks something outside your capabilities, state that it is outside the current Command Protocol and offer a relevant alternative.`
    };

    try {
      const allMessages: ChatMessage[] = [systemMessage as ChatMessage, ...messages.filter((m: any) => m.role !== "system")];

      const response = await callAI(allMessages, TOOL_DEFINITIONS);
      const assistantMessage = response.choices[0].message;

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolMessages = [];
        for (const toolCall of assistantMessage.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeTool(toolCall.function.name, args, agencyId || '', userId);
          toolMessages.push({
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        const followUpMessages = [...allMessages, assistantMessage, ...toolMessages];
        const followUpResponse = await callAI(followUpMessages, []);

        return NextResponse.json({
          content: followUpResponse.choices[0].message.content,
        });
      }

      return NextResponse.json({
        content: assistantMessage.content,
      });
    } catch (error: any) {
      console.error('AI chat error:', error);
      return NextResponse.json({
        error: 'An error occurred while generating the response. Please try again.',
      }, { status: 200 });
    } finally {
      if (agencyId) {
        try {
          const { incrementFeatureUsage } = await import('@/lib/feature-access');
          await incrementFeatureUsage(agencyId, 'aiAssistant');
        } catch (usageErr) {
          console.error('Failed to increment AI usage', usageErr);
        }
      }
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    requiredFeature: 'aiAssistant',
  }
);
