import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { clients, agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { randomUUID } from 'crypto';
import { validateRequestBody, withApiSecurity } from '@/lib/api-security';
import { createClientSchema } from '@/lib/validation-schemas';
import { z } from 'zod';

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Validate request body
    const validation = await validateRequestBody(request, createClientSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const clientData = validation.data as z.infer<typeof createClientSchema>;

    // Create new client
    const newClient = await db
      .insert(clients)
      .values({
        id: randomUUID(),
        agencyId: agencyId,
        name: clientData.name,
        email: clientData.email || null,
        phone: clientData.phone || null,
        address: clientData.address || null,
        industry: clientData.industry || null,
      })
      .returning({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        industry: clients.industry,
        createdAt: clients.createdAt,
      })
      .then((r: any[]) => r[0]);

    return NextResponse.json({
      success: true,
      client: newClient,
      message: 'Client added successfully',
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'client.create',
    requiredFeature: 'crm_basic',
  }
);
