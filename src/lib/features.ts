// Tier-based feature configuration
// Maps features to subscription tiers and their limits

export type SubscriptionTier = 'solo' | 'growth' | 'enterprise';

export interface FeatureConfig {
  name: string;
  description: string;
  tiers: {
    solo: boolean | { enabled: boolean; limit?: number };
    growth: boolean | { enabled: boolean; limit?: number };
    enterprise: boolean | { enabled: boolean; limit?: number };
  };
}

export const FEATURES: Record<string, FeatureConfig> = {
  // Policy Management
  policies: {
    name: 'Policies in Book of Business',
    description: 'Maximum number of policies you can manage',
    tiers: {
      solo: { enabled: true, limit: 500 },
      growth: { enabled: true, limit: 2500 },
      enterprise: { enabled: true, limit: Infinity },
    },
  },

  // AI Features
  aiRateForensics: {
    name: 'AI Rate Forensics Reports',
    description: 'AI-generated rate increase explanations for clients',
    tiers: {
      solo: { enabled: true, limit: 10 },
      growth: { enabled: true, limit: Infinity },
      enterprise: { enabled: true, limit: Infinity },
    },
  },

  // Renewal Engine
  renewalAutomation: {
    name: '90-60-30 Day Automated Renewal Engine',
    description: 'Automated renewal tracking and alerts',
    tiers: {
      solo: true,
      growth: true,
      enterprise: true,
    },
  },

  // Risk Dashboard
  policyLeakageDashboard: {
    name: 'Policy Leakage Risk Dashboard',
    description: 'Real-time risk scoring and policy leakage alerts',
    tiers: {
      solo: false,
      growth: true,
      enterprise: true,
    },
  },

  // File Uploads
  fileUploads: {
    name: 'Basic File Uploads',
    description: 'Attach PDFs and documents to policies',
    tiers: {
      solo: false,
      growth: true,
      enterprise: true,
    },
  },

  // Team Features
  teamLogins: {
    name: 'Producer/CSR Logins',
    description: 'Team member accounts with role-based access',
    tiers: {
      solo: { enabled: false, limit: 0 },
      growth: { enabled: true, limit: 3 },
      enterprise: { enabled: true, limit: Infinity },
    },
  },

  // White-Label
  whiteLabelPortal: {
    name: 'White-Labeled Client Portal',
    description: 'Custom-branded portal for your clients',
    tiers: {
      solo: false,
      growth: false,
      enterprise: true,
    },
  },

  // CSV Import/Export
  csvImport: {
    name: 'CSV Import',
    description: 'Import policies from CSV files',
    tiers: {
      solo: true,
      growth: true,
      enterprise: true,
    },
  },

  csvExport: {
    name: 'CSV Export',
    description: 'Export your data to CSV files',
    tiers: {
      solo: true,
      growth: true,
      enterprise: true,
    },
  },

  // Analytics
  basicAnalytics: {
    name: 'Basic Analytics',
    description: 'Portfolio overview and carrier distribution',
    tiers: {
      solo: true,
      growth: true,
      enterprise: true,
    },
  },

  advancedAnalytics: {
    name: 'Advanced Analytics',
    description: 'Detailed insights and trend analysis',
    tiers: {
      solo: false,
      growth: true,
      enterprise: true,
    },
  },

  // Support
  support: {
    name: 'Support Level',
    description: 'Access to customer support',
    tiers: {
      solo: { enabled: true, limit: undefined },
      growth: { enabled: true, limit: undefined },
      enterprise: { enabled: true, limit: undefined },
    },
  },
};

// Helper function to check if a feature is enabled for a tier
export function isFeatureEnabled(
  featureKey: string,
  tier: SubscriptionTier
): boolean {
  const feature = FEATURES[featureKey];
  if (!feature) return false;

  const tierConfig = feature.tiers[tier];
  
  if (typeof tierConfig === 'boolean') {
    return tierConfig;
  }
  
  return tierConfig.enabled;
}

// Helper function to get feature limit for a tier
export function getFeatureLimit(
  featureKey: string,
  tier: SubscriptionTier
): number | null {
  const feature = FEATURES[featureKey];
  if (!feature) return null;

  const tierConfig = feature.tiers[tier];
  
  if (typeof tierConfig === 'boolean') {
    return tierConfig ? Infinity : 0;
  }
  
  return tierConfig.limit ?? null;
}

// Helper function to check if usage is within limit
export function isWithinLimit(
  featureKey: string,
  tier: SubscriptionTier,
  currentUsage: number
): boolean {
  const limit = getFeatureLimit(featureKey, tier);
  
  if (limit === null) return true;
  if (limit === Infinity) return true;
  
  return currentUsage < limit;
}

// Get tier display name
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    solo: 'Solo Agent',
    growth: 'Growth Agency',
    enterprise: 'Enterprise',
  };
  return names[tier];
}

// Get tier price
export function getTierPrice(tier: SubscriptionTier): number {
  const prices: Record<SubscriptionTier, number> = {
    solo: 99,
    growth: 249,
    enterprise: 499,
  };
  return prices[tier];
}

// Get upgrade message for feature
export function getUpgradeMessage(
  featureKey: string,
  currentTier: SubscriptionTier
): string {
  const feature = FEATURES[featureKey];
  if (!feature) return 'Upgrade your plan to access this feature.';

  const tierOrder: SubscriptionTier[] = ['solo', 'growth', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  // Find next tier that has this feature
  for (let i = currentIndex + 1; i < tierOrder.length; i++) {
    const nextTier = tierOrder[i];
    if (isFeatureEnabled(featureKey, nextTier)) {
      const price = getTierPrice(nextTier);
      const tierName = getTierDisplayName(nextTier);
      return `Upgrade to ${tierName} ($${price}/month) to unlock ${feature.name}.`;
    }
  }
  
  return 'This feature is not available in any plan.';
}
