import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

import { withApiSecurity } from '@/lib/api-security';

export const PUT = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const { agencyId } = context;
      
      if (!agencyId) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      const body = await request.json();
      const { name, subdomain, logoUrl, phone, email, address, businessHours, description } = body;

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

      // Validate required fields
      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      // Subdomain is only required for Enterprise tier
      if (currentAgency.subscriptionTier === 'enterprise' && !subdomain) {
        return NextResponse.json({ error: 'Subdomain is required for Enterprise tier' }, { status: 400 });
      }

      // Validate subdomain format (only for Enterprise tier)
      if (currentAgency.subscriptionTier === 'enterprise') {
        const subdomainRegex = /^[a-z0-9-]+$/;
        if (!subdomainRegex.test(subdomain)) {
          return NextResponse.json({ 
            error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' 
          }, { status: 400 });
        }

        // Check if subdomain is already taken by another agency
        const existingAgency = await db
          .select()
          .from(agencies)
          .where(and(
            eq(agencies.subdomain, subdomain),
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
