description: Audits codebases for common security vulnerabilities in RetainVault CRM (Next.js 16 + Neon/Drizzle + Clerk + Stripe + AI SDK + Inngest). Checks for exposed API keys, broken access control (Drizzle/RLS), missing auth validation, insecure AI usage flows, webhook verification gaps, and storage vulnerabilities. Use this skill whenever the user asks about security, wants a code review, or is writing code that handles authentication, payments, database access, AI API keys, secrets, or user data. Also trigger when the user says things like "is this safe?", "check my code", "audit this", "review for vulnerabilities", or "can someone hack this?".
license: MIT
metadata:
  author: RetainVault Security Audit
  version: "1.0"
---

Audit code for security vulnerabilities in the RetainVault CRM stack: **Next.js 16 (App Router) + Neon PostgreSQL + Drizzle ORM + Clerk Auth + Stripe + AI SDK (OpenAI Compatible + Google + DashScope) + Inngest + Resend + Backblaze B2 + Svix**.

AI assistants consistently get these patterns wrong, leading to real breaches, stolen API keys, unauthorized data access, and drained billing accounts. This workflow exists to catch those mistakes before they ship.


## The Core Principle

**Never trust the client.** Every price, user ID, role, subscription status, feature flag, AI usage counter, and database query must be validated or enforced server-side. If it exists only in the browser or request body, an attacker controls it.


## Tech Stack Specific Risks

Based on RetainVault's architecture, these are the highest-priority vulnerability vectors:

1. **Clerk Auth bypass** - Missing `auth()` checks in Server Actions/API routes
2. **Drizzle ORM injection** - Unsanitized inputs in raw SQL or `sql` template usage
3. **Stripe webhook forgery** - Missing signature verification on payment webhooks
4. **AI API key exposure** - DashScope/OpenAI/Google keys leaked to client bundle
5. **Inngest event spoofing** - Unsigned events triggering unauthorized background jobs
6. **Backblaze B2 overexposure** - Public bucket access, missing upload validation
7. **Resend email abuse** - Unrestricted email sending without rate limits


## Audit Process

Examine the codebase systematically. For each step, load the relevant files only if they exist. Skip steps that aren't relevant.

### 1. Secrets & Environment Variables

**What to check:**
- Scan for hardcoded API keys, tokens, or credentials in source code
- Verify sensitive keys are NOT exposed via `NEXT_PUBLIC_` prefix:
  - `CLERK_SECRET_KEY` (must be server-only)
  - `STRIPE_SECRET_KEY` (must be server-only)
  - `DASHSCOPE_API_KEY` (must be server-only)
  - `RESEND_API_KEY` (must be server-only)
  - `INNGEST_SIGNING_KEY` (must be server-only)
  - `B2_SECRET_ACCESS_KEY` (must be server-only)
- Verify `.env` is in `.gitignore`
- Check for keys committed in git history

**Files to check:**
- `.env` (should be in `.gitignore`)
- `src/lib/` (API client initialization)
- `src/actions/` (Server Actions with secrets)
- `next.config.ts` (env var exposure)

**Critical patterns:**
```typescript
// ❌ CRITICAL: AI API key exposed to client
const apiKey = process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY

// ✅ CORRECT: Server-side only
const apiKey = process.env.DASHSCOPE_API_KEY
```

### 2. Database Access Control (Drizzle + Neon)

**What to check:**
- All database queries require Clerk `userId` filtering
- No raw SQL with unsanitized inputs
- Row-level security: every query scoped to authenticated user
- No direct `db.table.findMany()` without `where: { userId }` clause
- Check for SQL injection via `sql` template literal misuse

**Files to check:**
- `src/db/schema.ts` (table definitions, missing RLS)
- `src/actions/` (database operations)
- `src/lib/db.ts` or similar (Drizzle client setup)

**Critical patterns:**
```typescript
// ❌ HIGH: Missing user scoping - can access ALL data
const policies = await db.policies.findMany()

// ✅ CORRECT: Scoped to authenticated user
const { userId } = auth()
if (!userId) throw new Error("Unauthorized")
const policies = await db.policies.findMany({
  where: eq(policies.userId, userId)
})

// ❌ HIGH: SQL injection via string concatenation
const result = await db.execute(sql`SELECT * FROM users WHERE name = '${name}'`)

// ✅ CORRECT: Parameterized query
const result = await db.execute(sql`SELECT * FROM users WHERE name = ${name}`)
```

### 3. Authentication & Authorization (Clerk)

**What to check:**
- Every Server Action calls `auth()` from `@clerk/nextjs`
- API routes protected with Clerk middleware
- Role-based access control enforced server-side (not client trust)
- No reliance on `useUser()` hook for security decisions
- Svix webhook signature verification for Clerk events

**Files to check:**
- `src/middleware.ts` (Clerk middleware setup)
- `src/app/api/webhooks/clerk/route.ts` (Svix verification)
- `src/actions/` (auth checks in Server Actions)
- `proxy.ts` (Clerk proxy configuration)

**Critical patterns:**
```typescript
// ❌ CRITICAL: No auth check in Server Action
export async function deletePolicy(policyId: string) {
  await db.policies.delete(eq(policies.id, policyId))
}

// ✅ CORRECT: Auth + ownership verification
export async function deletePolicy(policyId: string) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")
  
  const policy = await db.policies.findFirst({
    where: and(eq(policies.id, policyId), eq(policies.userId, userId))
  })
  if (!policy) throw new Error("Forbidden")
  
  await db.policies.delete(eq(policies.id, policyId))
}

// ❌ HIGH: Clerk webhook without signature verification
export async function POST(request: Request) {
  const body = await request.json()
  // Process user creation...
}

// ✅ CORRECT: Svix signature verification
import { Webhook } from "svix"

export async function POST(request: Request) {
  const payload = await request.text()
  const headers = request.headers
  
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  const evt = wh.verify(payload, {
    "svix-id": headers.get("svix-id")!,
    "svix-timestamp": headers.get("svix-timestamp")!,
    "svix-signature": headers.get("svix-signature")!,
  })
  
  // Process verified event...
}
```

### 4. Rate Limiting & Abuse Prevention

**What to check:**
- AI generation endpoints have per-user rate limits
- Email sending (Resend) has usage caps
- Auth endpoints protected from brute force
- Inngest functions have idempotency guards
- No unbounded background job triggers

**Files to check:**
- `src/app/api/` (AI/email endpoints)
- `src/inngest/` (background functions)
- `src/actions/` (Server Actions with expensive operations)

**Critical patterns:**
```typescript
// ❌ HIGH: Unbounded AI usage - can drain API quota
export async function generatePolicySummary(prompt: string) {
  const result = await generateText({
    model: openaiCompatible("gpt-4"),
    prompt
  })
  return result.text
}

// ✅ CORRECT: Rate limited + user tracking
export async function generatePolicySummary(prompt: string) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")
  
  // Check usage count
  const usage = await db.aiUsage.findFirst({
    where: eq(aiUsage.userId, userId)
  })
  if (usage && usage.count >= usage.limit) {
    throw new Error("AI usage limit exceeded")
  }
  
  const result = await generateText({
    model: openaiCompatible("gpt-4"),
    prompt
  })
  
  // Increment usage
  await db.aiUsage.update({ count: usage.count + 1 })
  return result.text
}
```

### 5. Payment Security (Stripe)

**What to check:**
- Prices NEVER taken from client request body
- All prices looked up server-side via `STRIPE_*_PRICE_ID` env vars
- Stripe webhook signature verification with `stripe.webhooks.constructEvent()`
- Subscription status validated server-side, not from client
- No client-side access to `STRIPE_SECRET_KEY`

**Files to check:**
- `src/app/api/stripe/` (Stripe routes)
- `src/app/api/webhooks/stripe/route.ts` (webhook handler)
- `src/actions/` (payment-related Server Actions)

**Critical patterns:**
```typescript
// ❌ CRITICAL: Price from client - can be manipulated
export async function createCheckoutSession(price: number) {
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price_data: { unit_amount: price } }]
  })
}

// ✅ CORRECT: Price ID from env, looked up server-side
export async function createCheckoutSession(tier: "solo" | "growth" | "enterprise") {
  const priceId = {
    solo: process.env.STRIPE_SOLO_PRICE_ID,
    growth: process.env.STRIPE_GROWTH_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
  }[tier]
  
  if (!priceId) throw new Error("Invalid tier")
  
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }]
  })
  return session.url
}

// ❌ CRITICAL: Webhook without signature verification
export async function POST(request: Request) {
  const body = await request.json()
  if (body.type === "checkout.session.completed") {
    // Update subscription...
  }
}

// ✅ CORRECT: Signature verification
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
  
  if (event.type === "checkout.session.completed") {
    // Update subscription...
  }
  
  return new Response("OK")
}
```

### 6. AI / LLM Integration Security

**What to check:**
- AI API keys (`DASHSCOPE_API_KEY`, OpenAI, Google) NEVER exposed to client
- AI usage capped per user/subscription tier
- Prompt injection validation (user input sanitization)
- AI output sanitized before rendering (XSS prevention)
- Model selection enforced server-side (user can't force expensive models)

**Files to check:**
- `src/actions/` (AI Server Actions)
- `src/lib/ai.ts` or similar (AI client setup)
- `src/app/api/ai/` (AI API routes)

**Critical patterns:**
```typescript
// ❌ HIGH: User input directly in prompt - injection risk
export async function summarizePolicy(policyText: string) {
  const result = await generateText({
    model: dashscope("qwen-max"),
    prompt: `Summarize this policy: ${policyText}`
  })
  return result.text
}

// ✅ CORRECT: Input validation + system prompt isolation
export async function summarizePolicy(policyText: string) {
  if (policyText.length > 50000) throw new Error("Policy too long")
  
  const result = await generateText({
    model: dashscope("qwen-max"),
    system: "You are a policy summary assistant. Summarize the provided policy.",
    prompt: policyText
  })
  
  // Sanitize output before returning
  return sanitizeHtml(result.text)
}
```

### 7. Background Jobs (Inngest)

**What to check:**
- Inngest signing key verification on event reception
- Functions validate expected event structure
- No unauthorized data manipulation via spoofed events
- Idempotency keys prevent duplicate execution
- Sensitive operations in jobs have auth context

**Files to check:**
- `src/inngest/` (Inngest function definitions)
- `src/app/api/inngest/route.ts` (Inngest endpoint)

**Critical patterns:**
```typescript
// ❌ HIGH: Inngest endpoint without signature verification
export async function POST(request: Request) {
  const body = await request.json()
  // Process event...
}

// ✅ CORRECT: Inngest with signature verification
import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"

export const { POST } = serve({
  client: inngest,
  functions: [/* your functions */],
  signingKey: process.env.INNGEST_SIGNING_KEY!,
})
```

### 8. File Storage Security (Backblaze B2)

**What to check:**
- B2 credentials (`B2_ACCESS_KEY_ID`, `B2_SECRET_ACCESS_KEY`) server-only
- Upload endpoints validate file types and sizes
- No public write access to bucket without validation
- User uploads scoped to user ID (no path traversal)
- Signed URLs for private file access

**Files to check:**
- `src/app/api/upload/` (upload routes)
- `src/lib/storage.ts` or similar (B2 client setup)

**Critical patterns:**
```typescript
// ❌ HIGH: Unvalidated file upload
export async function uploadFile(file: File) {
  await s3.putObject({
    Bucket: process.env.B2_BUCKET_NAME!,
    Key: file.name,
    Body: file
  })
}

// ✅ CORRECT: Validated upload with user scoping
export async function uploadFile(userId: string, file: File) {
  // Validate file type
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Invalid file type")
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large")
  }
  
  // Sanitize filename + scope to user
  const sanitizedKey = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
  
  await s3.putObject({
    Bucket: process.env.B2_BUCKET_NAME!,
    Key: sanitizedKey,
    Body: file
  })
}
```

### 9. Email Security (Resend)

**What to check:**
- Email sending rate limited per user
- No user-controlled recipient addresses without validation
- Email templates sanitize user input (prevent email injection)
- Resend API key server-only

**Files to check:**
- `src/actions/` (email Server Actions)
- `emails/` (email templates)

### 10. Deployment Configuration

**What to check:**
- `next.config.ts` security headers (CSP, X-Frame-Options, etc.)
- Source maps NOT exposed in production
- Environment variable validation for required keys
- No debug endpoints in production

**Files to check:**
- `next.config.ts`
- `.env` (production vs development keys)

**Recommended security headers:**
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}
```


## Audit Execution Order

When performing a security audit:

1. **Start with `.env`** - Check for exposed secrets and `NEXT_PUBLIC_` misuse
2. **Review `src/middleware.ts`** - Verify Clerk auth enforcement
3. **Audit all `src/actions/`** - Check auth, DB scoping, and input validation
4. **Review all `src/app/api/`** - Verify endpoint protection
5. **Check webhook handlers** - Stripe, Clerk/Svix, Inngest signature verification
6. **Review AI usage** - Rate limiting, prompt injection, output sanitization
7. **Check file uploads** - B2 storage validation
8. **Review Inngest functions** - Event validation and idempotency
9. **Check `next.config.ts`** - Security headers and production settings


## Output Format

Organize findings by severity: **Critical** → **High** → **Medium** → **Low**.

For each issue:
1. State the file and relevant line(s).
2. Name the vulnerability.
3. Explain what an attacker could do (concrete impact, not abstract risk).
4. Show a before/after code fix.

Skip areas with no issues. End with a prioritized summary.

### Example Output

#### Critical

**`src/actions/policies.ts:15` — Missing auth check in Server Action**

The `deletePolicy` action has no Clerk `auth()` check. Any unauthenticated user can call this action to delete any policy in the database.

```typescript
// Before
export async function deletePolicy(policyId: string) {
  await db.policies.delete(eq(policies.id, policyId))
}

// After
export async function deletePolicy(policyId: string) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")
  
  const policy = await db.policies.findFirst({
    where: and(eq(policies.id, policyId), eq(policies.userId, userId))
  })
  if (!policy) throw new Error("Forbidden")
  
  await db.policies.delete(eq(policies.id, policyId))
}
```

#### High

**`src/app/api/ai/summarize/route.ts:10` — No AI usage rate limiting**

Users can call this endpoint unlimited times, draining the DashScope API quota and incurring unexpected costs.

```typescript
// Before
export async function POST(request: Request) {
  const { policyText } = await request.json()
  const result = await generateText({ model: dashscope("qwen-max"), prompt: policyText })
  return Response.json({ summary: result.text })
}

// After
export async function POST(request: Request) {
  const { userId } = auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })
  
  const usage = await db.aiUsage.findFirst({ where: eq(aiUsage.userId, userId) })
  if (usage && usage.count >= usage.limit) {
    return new Response("AI usage limit exceeded", { status: 429 })
  }
  
  const { policyText } = await request.json()
  const result = await generateText({ model: dashscope("qwen-max"), prompt: policyText })
  
  await db.aiUsage.update({ count: usage.count + 1 })
  return Response.json({ summary: result.text })
}
```

### Summary

1. **Missing auth in Server Actions (Critical):** Any user can access/modify/delete other users' data. Add `auth()` checks to all actions.
2. **No AI rate limiting (High):** API quota can be drained. Implement per-user usage tracking.
3. **Stripe webhook unsigned (Critical):** Attackers can forge payment events. Add signature verification.


## When Generating Code

These rules also apply proactively. Before writing code that touches:
- **Database queries** → Add Clerk `userId` scoping
- **Server Actions** → Add `auth()` check at the top
- **Stripe integration** → Use server-side price lookup + webhook verification
- **AI SDK calls** → Add usage tracking + input validation
- **File uploads** → Validate type, size, and sanitize filenames
- **Email sending** → Add rate limiting
- **API routes** → Verify auth + input validation

Consult this workflow to avoid introducing vulnerabilities in the first place. **Prevention is better than detection.**


## Quick Reference: RetainVault Security Checklist

| Area | Must Have | Common Mistake |
|------|-----------|----------------|
| **Clerk Auth** | `auth()` in every Server Action | Relying on client-side `useUser()` |
| **Drizzle ORM** | `where: { userId }` on every query | Unscoped `findMany()` |
| **Stripe** | Webhook signature verification + server prices | Client-side prices |
| **AI SDK** | Usage caps + input validation | Unbounded API calls |
| **Inngest** | Signing key verification | Unsigned event handlers |
| **B2 Storage** | File validation + user scoping | Public write access |
| **Resend** | Rate limited email sending | Unrestricted sending |
| **Env Vars** | Sensitive keys without `NEXT_PUBLIC_` | Exposing secret keys to client |
| **Webhooks** | Svix/Stripe signature verification | Trusting request body |
| **Headers** | Security headers in `next.config.ts` | No CSP or X-Frame-Options |
