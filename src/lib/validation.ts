import { z } from 'zod';

/**
 * Input validation utilities for security
 * Prevents injection attacks, XSS, and malformed data
 */

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Sanitize HTML content (basic - use DOMPurify on client for full sanitization)
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized.trim();
}

// Validate and sanitize filename for uploads
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove special characters except dots, dashes, underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9.-_]/g, '_');
  
  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    sanitized = sanitized.substring(0, 250 - ext.length) + '.' + ext;
  }
  
  return sanitized;
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validate phone number (US format)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?1?\s*[-.]?\s*\(?\d{3}\)?\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}$/;
  return phoneRegex.test(phone);
}

// Validate UUID format
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate URL format
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Common validation schemas
export const schemas = {
  // Agency ID validation
  agencyId: z.string().uuid(),
  
  // Policy ID validation
  policyId: z.string().uuid(),
  
  // Client ID validation
  clientId: z.string().uuid(),
  
  // User ID validation
  userId: z.string().uuid(),
  
  // Email validation
  email: z.string().email().max(254),
  
  // Phone validation (optional)
  phone: z.string().max(20).optional(),
  
  // Name validation
  name: z.string().min(1).max(100).transform(sanitizeString),
  
  // Policy number validation
  policyNumber: z.string().min(1).max(50).transform(sanitizeString),
  
  // Carrier name validation
  carrier: z.string().min(1).max(100).transform(sanitizeString),
  
  // Premium validation (positive number)
  premium: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(v => parseFloat(v)),
  
  // Date validation
  date: z.string().datetime().or(z.date()),
  
  // Notes validation (limited length)
  notes: z.string().max(5000).transform(sanitizeHtml).optional(),
  
  // Subscription tier validation
  subscriptionTier: z.enum(['solo', 'growth', 'enterprise']),
  
  // Role validation
  role: z.enum(['owner', 'admin', 'producer', 'staff']),
  
  // File upload validation
  fileUpload: z.object({
    name: z.string().transform(sanitizeFilename),
    type: z.enum([
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  }),
  
  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
};

// Validate input against schema with error handling
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      error: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
    };
  } catch (error) {
    return { success: false, error: 'Validation failed' };
  }
}

// Validate AI prompt input (prevent injection)
export function validateAIPrompt(prompt: string): { valid: boolean; sanitized: string; error?: string } {
  if (typeof prompt !== 'string') {
    return { valid: false, sanitized: '', error: 'Prompt must be a string' };
  }
  
  // Limit length
  if (prompt.length > 50000) {
    return { valid: false, sanitized: '', error: 'Prompt exceeds maximum length of 50,000 characters' };
  }
  
  if (prompt.length === 0) {
    return { valid: false, sanitized: '', error: 'Prompt cannot be empty' };
  }
  
  // Check for potential injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above)\s+(instructions|prompts)/i,
    /disregard\s+(all\s+)?(previous|above)/i,
    /you\s+are\s+now\s+\w+/i,
    /system:\s*/i,
    /<\|.*?\|>/,
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      // Sanitize by removing the pattern
      prompt = prompt.replace(pattern, '[filtered]');
    }
  }
  
  return { valid: true, sanitized: prompt };
}

// Validate webhook payload structure
export function validateWebhookPayload(payload: unknown): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload structure' };
  }
  
  const p = payload as Record<string, unknown>;
  
  if (!p.event_type && !p.type) {
    return { valid: false, error: 'Missing event type' };
  }
  
  if (!p.data) {
    return { valid: false, error: 'Missing event data' };
  }
  
  return { valid: true };
}

// Rate limit identifier extraction helpers
export function getRateLimitIdentifier(
  userId?: string,
  ip?: string,
  userAgent?: string
): string {
  // Prefer user ID for authenticated requests
  if (userId) return `user:${userId}`;
  
  // Fall back to IP + user agent hash for anonymous requests
  if (ip) {
    const hash = userAgent ? simpleHash(ip + userAgent) : '';
    return `ip:${ip}:${hash}`;
  }
  
  // Last resort - use timestamp bucket (very permissive)
  return `anon:${Math.floor(Date.now() / 60000)}`;
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Validate file magic bytes against declared MIME type
 * Prevents extension spoofing attacks
 */
export function validateMagicBytes(buffer: Buffer | Uint8Array, mimeType: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  // Signatures
  const signatures: Record<string, number[][]> = {
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // 'RIFF' ... 'WEBP'
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  };

  // Special case for SVG (text-based)
  if (mimeType === 'image/svg+xml') {
    const content = Buffer.from(buffer).toString('utf8').toLowerCase();
    return content.includes('<svg') || content.includes('<?xml');
  }

  const expected = signatures[mimeType];
  if (!expected) return true; // If we don't have a signature for this type, pass it (or decide to fail)

  return expected.some(sig => {
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    return true;
  });
}

