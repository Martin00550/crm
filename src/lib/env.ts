/**
 * Environment variable validation and access
 * Ensures required secrets are present and not exposed to client
 */

import { logger } from '@/lib/logger';

// Server-only environment variables (NEVER expose to client)
const SERVER_ONLY_VARS = [
  'DATABASE_URL',
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_REDIRECT_URI',
  'WORKOS_COOKIE_PASSWORD',
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'DASHSCOPE_API_KEY',
  'GEMINI_API_KEY',
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
  'B2_ACCESS_KEY_ID',
  'B2_SECRET_ACCESS_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
] as const;

// Public environment variables (safe to expose to client)
const PUBLIC_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN',
  'NEXT_PUBLIC_PADDLE_SOLO_PRICE_ID',
  'NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID',
  'NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID',
] as const;

// Required environment variables
const REQUIRED_VARS = [
  'DATABASE_URL',
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_REDIRECT_URI',
  'WORKOS_COOKIE_PASSWORD',
] as const;

export interface EnvConfig {
  // Database
  databaseUrl: string;
  
  // WorkOS
  workosApiKey: string;
  workosClientId: string;
  workosRedirectUri: string;
  workosCookiePassword: string;
  
  // Paddle
  paddleApiKey?: string;
  paddleClientToken?: string;
  paddleWebhookSecret?: string;
  paddleSoloPriceId?: string;
  paddleGrowthPriceId?: string;
  paddleEnterprisePriceId?: string;
  
  // Email
  resendApiKey?: string;
  
  // AI
  dashscopeApiKey?: string;
  geminiApiKey?: string;
  
  // Inngest
  inngestEventKey?: string;
  inngestSigningKey?: string;
  inngestAppId?: string;
  
  // Storage
  b2AccessKeyId?: string;
  b2SecretAccessKey?: string;
  b2Region?: string;
  b2Endpoint?: string;
  b2BucketName?: string;
  b2PublicUrl?: string;
  
  // App
  appUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * Get and validate environment variables
 * Call this at app startup to fail fast on missing config
 */
export function getEnv(): EnvConfig {
  const env: EnvConfig = {
    databaseUrl: process.env.DATABASE_URL || '',
    workosApiKey: process.env.WORKOS_API_KEY || '',
    workosClientId: process.env.WORKOS_CLIENT_ID || '',
    workosRedirectUri: process.env.WORKOS_REDIRECT_URI || '',
    workosCookiePassword: process.env.WORKOS_COOKIE_PASSWORD || '',
    paddleApiKey: process.env.PADDLE_API_KEY,
    paddleClientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
    paddleSoloPriceId: process.env.PADDLE_SOLO_PRICE_ID,
    paddleGrowthPriceId: process.env.PADDLE_GROWTH_PRICE_ID,
    paddleEnterprisePriceId: process.env.PADDLE_ENTERPRISE_PRICE_ID,
    resendApiKey: process.env.RESEND_API_KEY,
    dashscopeApiKey: process.env.DASHSCOPE_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    inngestEventKey: process.env.INNGEST_EVENT_KEY,
    inngestSigningKey: process.env.INNGEST_SIGNING_KEY,
    inngestAppId: process.env.INNGEST_APP_ID,
    b2AccessKeyId: process.env.B2_ACCESS_KEY_ID,
    b2SecretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
    b2Region: process.env.B2_REGION,
    b2Endpoint: process.env.B2_ENDPOINT,
    b2BucketName: process.env.B2_BUCKET_NAME,
    b2PublicUrl: process.env.B2_PUBLIC_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: (process.env.NODE_ENV as EnvConfig['nodeEnv']) || 'development',
  };
  
  return env;
}

/**
 * Validate required environment variables
 * Returns list of missing variables
 */
export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check for accidentally exposed server-only vars
  for (const varName of SERVER_ONLY_VARS) {
    if (process.env[`NEXT_PUBLIC_${varName}`]) {
      warnings.push(`CRITICAL: ${varName} is exposed via NEXT_PUBLIC_ prefix! Remove the prefix immediately.`);
    }
  }
  
  // Check for placeholder values
  const placeholderPatterns = ['xxx', 'your_', 'replace_', 'sk_test_', 'pk_test_'];
  const criticalVars = ['WORKOS_API_KEY', 'PADDLE_API_KEY', 'RESEND_API_KEY', 'GEMINI_API_KEY'];
  
  for (const varName of criticalVars) {
    const value = process.env[varName];
    if (value && placeholderPatterns.some(p => value.toLowerCase().includes(p))) {
      if (process.env.NODE_ENV === 'production') {
        warnings.push(`WARNING: ${varName} appears to contain a placeholder value. Ensure production uses real keys.`);
      }
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Check if a variable is a server-only secret
 */
export function isServerOnlyVar(varName: string): boolean {
  return SERVER_ONLY_VARS.includes(varName as any);
}

/**
 * Get a server-only environment variable
 * Throws if accessed on client side
 */
export function getServerEnv(varName: typeof SERVER_ONLY_VARS[number]): string | undefined {
  if (typeof window !== 'undefined') {
    throw new Error(`Attempted to access server-only env var ${varName} on client side`);
  }
  return process.env[varName];
}

/**
 * Log environment validation results (call on server startup)
 */
export function logEnvStatus(): void {
  if (typeof window !== 'undefined') return;
  
  const { valid, missing, warnings } = validateEnv();
  
  if (!valid) {
    logger.error('ENV VALIDATION FAILED', { missing });
  }
  
  if (warnings.length > 0) {
    logger.warn('ENV WARNINGS', { warnings });
  }
  
  if (valid && warnings.length === 0) {
    logger.info('ENV: All required variables present');
  }
}

// Run validation on import in development
if (process.env.NODE_ENV === 'development') {
  logEnvStatus();
}
