// Paddle Price IDs and Tiers shared between client and server
// Do not import server-only libraries (like next/cache or crypto) in this file

export const PADDLE_PRICE_IDS = {
  solo: process.env.PADDLE_SOLO_PRICE_ID || 'pri_xxx_solo',
  growth: process.env.PADDLE_GROWTH_PRICE_ID || 'pri_xxx_growth',
  enterprise: process.env.PADDLE_ENTERPRISE_PRICE_ID || 'pri_xxx_enterprise',
};

export const SUBSCRIPTION_TIERS = {
  solo: {
    name: 'Solo Agent',
    priceId: PADDLE_PRICE_IDS.solo,
    price: 99,
    features: [
      'Single User Access',
      'Standard Policy Ledger',
      'Email Renewal Reminders',
      'Carrier Data Sync',
      '5 Carrier Integrations',
    ],
  },
  growth: {
    name: 'Growth Agency',
    priceId: PADDLE_PRICE_IDS.growth,
    price: 249,
    features: [
      'Up to 3 Staff Members',
      'AI Rate Increase Explainer',
      'WhatsApp Renewal Alerts',
      'Advanced Analytics Dashboard',
      'Team Performance Metrics',
      'Unlimited Carrier Integrations',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: PADDLE_PRICE_IDS.enterprise,
    price: 499,
    features: [
      'Unlimited Users (All Roles)',
      'White-Labeled Client Portal',
      'Dedicated Success Manager',
      'Custom Integration Builds',
      'SSO & Advanced Security',
      '24/7 Priority Support',
    ],
  },
};
