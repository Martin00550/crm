import { z } from 'zod';

// Client validation schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255),
  email: z.string().email('Invalid email format').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
});

// Policy validation schemas
export const createPolicySchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  policyNumber: z.string().min(1, 'Policy number is required').max(100),
  carrier: z.string().min(1, 'Carrier is required').max(100),
  policyType: z.string().min(1, 'Policy type is required').max(50),
  premium: z.string().or(z.number()).refine((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return !isNaN(num) && num > 0;
  }, 'Premium must be a positive number'),
  effectiveDate: z.string().or(z.date()),
  expirationDate: z.string().or(z.date()),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional(),
});

export const updatePolicySchema = z.object({
  policyNumber: z.string().min(1).max(100).optional(),
  carrier: z.string().min(1).max(100).optional(),
  policyType: z.string().min(1).max(50).optional(),
  premium: z.string().or(z.number()).optional(),
  effectiveDate: z.string().or(z.date()).optional(),
  expirationDate: z.string().or(z.date()).optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional(),
});

// Document validation schemas
export const uploadDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  policyId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
  category: z.enum(['policy', 'client', 'commission', 'other']).optional(),
});

// Agency branding validation
export const updateBrandingSchema = z.object({
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  description: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

// Invitation validation
export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(255),
  role: z.enum(['agent', 'admin', 'viewer']),
});

// Notification settings validation
export const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  email90Day: z.boolean().optional(),
  email60Day: z.boolean().optional(),
  email30Day: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  weeklyReportDay: z.number().min(0).max(6).optional(),
  autoRenewalAlerts: z.boolean().optional(),
  autoRenewalDays: z.number().min(1).max(365).optional(),
});
