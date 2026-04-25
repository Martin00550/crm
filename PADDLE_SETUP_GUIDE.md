# Paddle Payment Integration Setup Guide

## Overview
The CRM has been fully integrated with Paddle for payment processing, replacing Stripe. Paddle provides an easy-to-use popup checkout experience.

---

## What's Been Done

✅ **Backend Integration**
- Created `src/lib/paddle.ts` - Complete Paddle API integration
- Created `src/app/api/webhooks/paddle/route.ts` - Webhook handler
- Created `src/app/api/subscription/route.ts` - Subscription management API
- Updated `src/lib/team-access.ts` - Producer seat billing with Paddle

✅ **Frontend Components**
- Created `src/components/ui/PaddleCheckout.tsx` - Checkout button component
- Created `src/components/ui/PaddleScriptLoader.tsx` - Paddle.js loader
- Created `src/app/dashboard/settings/billing/page.tsx` - Billing management page

✅ **Database**
- Database schema updated (reusing existing fields for Paddle IDs)

✅ **Environment Variables**
- `.env` file updated with all Paddle configuration

---

## Setup Instructions

### 1. Create a Paddle Account

1. Go to https://www.paddle.com/
2. Sign up for a merchant account
3. Complete the onboarding process

### 2. Get Your API Credentials

1. Log into your Paddle Dashboard
2. Go to **Settings** → **Developer Tools** → **Authentication**
3. Copy these credentials:
   - **API Key** (for server-side)
   - **Client-side Token** (for checkout popup)

### 3. Create Your Products

In Paddle Dashboard, go to **Catalog** → **Products** and create 4 products:

#### Product 1: Solo Agent Plan
- **Name:** Solo Agent
- **Type:** Subscription (recurring)
- **Price:** $99/month
- **Billing Cycle:** Monthly
- **Copy the Price ID** (starts with `pri_`)

#### Product 2: Growth Agency Plan
- **Name:** Growth Agency
- **Type:** Subscription (recurring)
- **Price:** $249/month
- **Billing Cycle:** Monthly
- **Copy the Price ID**

#### Product 3: Enterprise Plan
- **Name:** Enterprise
- **Type:** Subscription (recurring)
- **Price:** $499/month
- **Billing Cycle:** Monthly
- **Copy the Price ID**

*(Note: Enterprise includes unlimited team members of all roles at no extra cost)*

### 4. Update Environment Variables

Open `.env` file and replace all placeholder values:

```env
# Paddle (Payment Processor)
PADDLE_API_KEY=your_api_key_here  # From Paddle Dashboard
PADDLE_CLIENT_TOKEN=your_client_token_here  # From Paddle Dashboard
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_client_token_here  # Same as above
NEXT_PUBLIC_PADDLE_SOLO_PRICE_ID=pri_actual_solo_id  # Your Solo plan Price ID
NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID=pri_actual_growth_id  # Your Growth plan Price ID
NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID=pri_actual_enterprise_id  # Your Enterprise plan Price ID
PADDLE_SOLO_PRICE_ID=pri_actual_solo_id  # Same as above
PADDLE_GROWTH_PRICE_ID=pri_actual_growth_id  # Same as above
PADDLE_ENTERPRISE_PRICE_ID=pri_actual_enterprise_id  # Same as above
PADDLE_PRODUCER_SEAT_PRICE_ID=pri_actual_producer_seat_id  # Your Producer seat Price ID
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here  # From Paddle Dashboard
```

### 5. Configure Webhooks

1. In Paddle Dashboard, go to **Alerts & Webhooks** → **Webhooks**
2. Add a new webhook endpoint:
   - **URL:** `https://yourdomain.com/api/webhooks/paddle`
   - **For local dev:** Use ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/paddle`
3. Subscribe to these events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `transaction.payment_failed`
4. Copy the **Webhook Signing Key** and add to `.env`

### 6. Test the Integration

#### Sandbox Testing
1. Use Paddle's sandbox environment first
2. Use sandbox API keys (different from live keys)
3. Test card numbers provided by Paddle docs

#### Live Testing
1. Switch to live API keys
2. Create a real subscription with small test amount
3. Verify webhook events are received
4. Cancel test subscription

---

## How It Works

### Subscription Flow

1. User clicks "Subscribe" button on billing page
2. Frontend calls `/api/subscription` POST endpoint
3. Backend creates a Paddle checkout session
4. Paddle popup checkout opens automatically
5. User completes payment in popup
6. Paddle sends webhook confirmation
7. Backend updates agency tier in database

### Producer Seat Billing (Enterprise)

1. Admin adds a new team member with "producer" role
2. System automatically calls `addProducerSeat()` 
3. Paddle adds $99/month to existing subscription
4. User is charged immediately (prorated)

### Webhook Events

- **subscription.created:** New subscription → Update agency tier
- **subscription.updated:** Changes to subscription → Update status
- **subscription.canceled:** User cancels → Revert to solo tier
- **transaction.payment_failed:** Payment issue → Mark as past_due

---

## File Structure

```
src/
├── lib/
│   ├── paddle.ts                    # Paddle API integration
│   └── team-access.ts               # Updated for Paddle
├── app/
│   ├── api/
│   │   ├── subscription/
│   │   │   └── route.ts             # Subscription management
│   │   └── webhooks/
│   │       └── paddle/
│   │           └── route.ts         # Webhook handler
│   └── dashboard/
│       └── settings/
│           └── billing/
│               └── page.tsx         # Billing page
└── components/
    └── ui/
        ├── PaddleCheckout.tsx       # Checkout button
        └── PaddleScriptLoader.tsx   # Paddle.js loader
```

---

## Testing Checklist

- [ ] Paddle account created
- [ ] API credentials added to `.env`
- [ ] All 4 products created in Paddle
- [ ] Price IDs updated in `.env`
- [ ] Webhook endpoint configured
- [ ] Webhook secret added to `.env`
- [ ] Test subscription purchase works
- [ ] Webhook events received
- [ ] Agency tier updates correctly
- [ ] Producer seat billing works (Enterprise)
- [ ] Subscription cancellation works
- [ ] Billing page displays correctly

---

## Troubleshooting

### Checkout popup doesn't open
- Check browser console for errors
- Verify `PADDLE_CLIENT_TOKEN` is correct
- Ensure Paddle.js script loaded (check Network tab)

### Webhook not received
- Test with Paddle's webhook test tool
- Verify endpoint URL is accessible
- Check webhook signing key matches

### Subscription not updating
- Check server logs for webhook processing errors
- Verify `agencyId` is in subscription custom_data
- Check database connection

---

## Next Steps

1. Complete Paddle account setup
2. Add real API credentials to `.env`
3. Test in sandbox mode first
4. Deploy to production
5. Switch to live API keys
6. Monitor first few real transactions

---

## Support

- Paddle Docs: https://developer.paddle.com/
- Paddle Support: https://support.paddle.com/
