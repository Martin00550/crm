import { z } from 'zod';

export const agencyProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .optional()
    .nullable(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid contact email').optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  businessHours: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').optional(),
});

export type AgencyProfileInput = z.infer<typeof agencyProfileSchema>;
