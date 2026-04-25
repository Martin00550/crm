import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sanitizeColor } from '@/lib/branding';
import { withApiSecurity } from '@/lib/api-security';
import { z } from 'zod';

// Validation schema for branding update
const brandingSchema = z.object({
  agencyId: z.string().uuid().optional(),
  branding: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    faviconUrl: z.string().url().optional(),
    description: z.string().max(500).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().max(254).optional(),
    address: z.string().max(500).optional(),
    businessHours: z.string().max(200).optional(),
  }).optional(),
  whiteLabelEnabled: z.boolean().optional(),
});

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId: userAgencyId } = context;
    if (!userAgencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = brandingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { agencyId, branding, whiteLabelEnabled } = validationResult.data;

    // Verify agencyId matches user's agency
    if (agencyId && agencyId !== userAgencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sanitize colors if branding is provided
    const sanitizedBranding = branding ? {
      ...branding,
      primaryColor: branding.primaryColor ? sanitizeColor(branding.primaryColor) : undefined,
      secondaryColor: branding.secondaryColor ? sanitizeColor(branding.secondaryColor) : undefined,
    } : undefined;

    // Update agency branding
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    await db
      .update(agencies)
      .set({
        branding: sanitizedBranding,
        whiteLabelEnabled,
        updatedAt: new Date(),
      })
      .where(eq(agencies.id, userAgencyId));

    return NextResponse.json({ success: true });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'branding.update',
  }
);
