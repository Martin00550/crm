import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  faviconUrl?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessHours?: string;
}

export interface AgencyWithBranding {
  id: string;
  name: string;
  subdomain: string | null;
  subscriptionTier: string;
  whiteLabelEnabled: boolean;
  branding: BrandingConfig;
}

const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#1e40af',
  secondaryColor: '#7c3aed',
};

// Get agency by subdomain
export async function getAgencyBySubdomain(subdomain: string): Promise<AgencyWithBranding | null> {
  if (!db) return null;

  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.subdomain, subdomain))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agency) return null;

  return {
    id: agency.id,
    name: agency.name,
    subdomain: agency.subdomain,
    subscriptionTier: agency.subscriptionTier,
    whiteLabelEnabled: agency.whiteLabelEnabled || false,
    branding: {
      ...DEFAULT_BRANDING,
      ...(agency.branding as BrandingConfig || {}),
    },
  };
}

// Get branding config for an agency
export async function getBrandingConfig(agencyId: string): Promise<BrandingConfig> {
  if (!db) return DEFAULT_BRANDING;

  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agency || !agency.branding) return DEFAULT_BRANDING;

  return {
    ...DEFAULT_BRANDING,
    ...(agency.branding as BrandingConfig),
  };
}

// Generate CSS variables from branding config
export function generateCSSVariables(config: BrandingConfig): string {
  return `
    --brand-primary: ${config.primaryColor};
    --brand-secondary: ${config.secondaryColor};
    --brand-primary-10: ${config.primaryColor}1a;
    --brand-primary-20: ${config.primaryColor}33;
    --brand-primary-50: ${config.primaryColor}80;
    --brand-secondary-10: ${config.secondaryColor}1a;
    --brand-secondary-20: ${config.secondaryColor}33;
    --brand-secondary-50: ${config.secondaryColor}80;
  `.trim();
}

// Convert hex to RGB for opacity variants
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

// Generate Tailwind-compatible color values
export function generateTailwindColors(config: BrandingConfig): Record<string, string> {
  return {
    primary: config.primaryColor,
    secondary: config.secondaryColor,
  };
}

// Validate hex color
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Sanitize color input
export function sanitizeColor(color: string | undefined): string {
  if (!color) return DEFAULT_BRANDING.primaryColor;
  
  // Add # if missing
  if (!color.startsWith('#')) {
    color = '#' + color;
  }
  
  // Validate
  if (!isValidHexColor(color)) {
    return DEFAULT_BRANDING.primaryColor;
  }
  
  return color;
}
