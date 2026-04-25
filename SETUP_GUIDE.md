# PolicyPulse - Setup Guide

## Database Migrations

### Required Migration

Run the following migration to ensure Paddle fields are properly named:

```bash
# Apply migration 005_rename_paddle_fields.sql
# This renames stripe_customer_id to paddle_customer_id
# and stripe_subscription_id to paddle_subscription_id
```

The migration file is located at: `migrations/005_rename_paddle_fields.sql`

If you're using a fresh database, ensure this migration is applied before running the application.

## Environment Variables

Add the following environment variables to your `.env` file:

### Required for Paddle Payment Processing

```bash
# Paddle API Configuration
PADDLE_API_KEY=pdl_live_xxx
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=pdl_ct_xxx
PADDLE_WEBHOOK_SECRET=pdl_whsec_xxx

# Paddle Price IDs
PADDLE_SOLO_PRICE_ID=pri_xxx_solo
PADDLE_GROWTH_PRICE_ID=pri_xxx_growth
PADDLE_ENTERPRISE_PRICE_ID=pri_xxx_enterprise
NEXT_PUBLIC_PADDLE_SOLO_PRICE_ID=pri_xxx_solo
NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID=pri_xxx_growth
NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID=pri_xxx_enterprise
```

### Required for Authentication

```bash
BETTER_AUTH_SECRET=your_better_auth_secret_key
```

Generate a secret with: `openssl rand -base64 32`

### Required for Database

```bash
DATABASE_URL=postgresql://username:password@host.neon.tech/neondb?sslmode=require
```

### Optional (Email, AI, etc.)

```bash
# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key
```

## Paddle Dashboard Configuration

### 1. Configure Webhook URL

Add the following webhook URL in your Paddle dashboard:

```
https://yourdomain.com/api/webhooks/paddle
```

### 2. Enable Webhook Events

Ensure the following events are enabled in Paddle:
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`
- `subscription.activated`
- `subscription.trial_ending`
- `transaction.payment_failed`
- `transaction.payment_succeeded`

### 3. Set Price IDs

Copy the price IDs from Paddle dashboard and add them to your `.env` file for:
- Solo tier
- Growth tier
- Enterprise tier

## Application URL

Set your application URL in the environment:

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
BETTER_AUTH_URL=https://yourdomain.com
```

## Development Mode

For local development, you can allow unsigned webhooks by setting:

```bash
ALLOW_UNSIGNED_WEBHOOKS=true
```

**⚠️ NEVER set this in production.**

## Verification

After setup, verify:

1. Database migration applied successfully
2. All environment variables are set
3. Paddle webhook is configured in dashboard
4. Paddle.js loads correctly in browser (check console)
5. Session API endpoint works: `/api/auth/session`

## Flow Test

Test the subscription flow:

1. Visit `/pricing`
2. Click "Start 14-Day Free Trial"
3. Sign up modal should open
4. After sign-up, checkout modal should open
5. Paddle checkout overlay should appear
6. Complete payment (or test in sandbox)
7. Webhook should create agency
8. User should be redirected to `/dashboard`
