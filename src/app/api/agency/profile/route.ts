import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

import { withApiSecurity } from '@/lib/api-security';

import { agencyProfileSchema } from '@/lib/validations/agency';

export const PUT = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const { agencyId } = context;
      
      if (!agencyId) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      const body = await request.json();
      
      // 1. Validate with Zod for strict type safety and data integrity
      const validation = agencyProfileSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json({ 
          error: 'Validation failed', 
          details: validation.error.flatten().fieldErrors 
        }, { status: 400 });
      }

      let { name, subdomain, logoUrl, phone, email, address, businessHours, description, currency } = validation.data;

      // Force-sanitize subdomain to prevent spaces and illegal characters
      if (subdomain) {
        subdomain = subdomain
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
      }

      // Get current agency to check tier
      const currentAgency = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, agencyId))
        .limit(1)
        .then((r: any[]) => r[0]);

      if (!currentAgency) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      // 2. Business Logic Checks (Tier & Uniqueness)
      
      // Subdomain is only required for Enterprise tier
      if (currentAgency.subscriptionTier === 'enterprise' && !subdomain) {
        return NextResponse.json({ error: 'Subdomain is required for Enterprise tier' }, { status: 400 });
      }

      if (currentAgency.subscriptionTier === 'enterprise') {
        // Check if subdomain is already taken by another agency
        const existingAgency = await db
          .select()
          .from(agencies)
          .where(and(
            eq(agencies.subdomain, subdomain!),
            ne(agencies.id, agencyId) // Exclude current agency
          ))
          .limit(1)
          .then((r: any[]) => r[0]);

        if (existingAgency) {
          return NextResponse.json({ 
            error: 'This subdomain is already taken. Please choose another.' 
          }, { status: 409 });
        }
      } else {
        // Non-Enterprise tiers can't set subdomain
        if (subdomain) {
          return NextResponse.json({ 
            error: 'Subdomain is an Enterprise-only feature. Please upgrade to Enterprise.' 
          }, { status: 403 });
        }
      }

      // Update agency profile
      const updatedAgency = await db
        .update(agencies)
        .set({
          name,
          subdomain: currentAgency.subscriptionTier === 'enterprise' ? subdomain : null,
          currency: currency || currentAgency.currency,
          branding: {
            ...currentAgency.branding,
            logoUrl: logoUrl || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            businessHours: businessHours || null,
            description: description || null,
          },
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, agencyId))
        .returning()
        .then((r: any[]) => r[0]);

      // Invalidate Edge Cache
      try {
        const { getCacheClient, CacheKeys } = await import('@/lib/cache');
        const cache = getCacheClient();
        if (cache) {
          const keysToInvalidate = [];
          if (currentAgency.subdomain) keysToInvalidate.push(CacheKeys.portalAgency(currentAgency.subdomain));
          if (subdomain && subdomain !== currentAgency.subdomain) keysToInvalidate.push(CacheKeys.portalAgency(subdomain));
          
          if (keysToInvalidate.length > 0) {
            await cache.del(...keysToInvalidate);
            logger.info('Edge cache invalidated for agency profile update', { agencyId, keysToInvalidate });
          }
        }
      } catch (err) {
        logger.error('Failed to invalidate cache during agency update', err);
      }

      return NextResponse.json({
        success: true,
        agency: updatedAgency,
      });
    } catch (error) {
      logger.error('Error updating agency profile', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
  }
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const agency = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    return NextResponse.json({ agency });
  } catch (error) {
    logger.error('Error fetching agency profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
