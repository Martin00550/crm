import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, agencies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withApiSecurity } from '@/lib/api-security';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId, params } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { id: clientId } = params;
    if (!db) { return NextResponse.json({ error: "Database connection failed" }, { status: 500 }); }

    // Get client details
    const client = await db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        industry: clients.industry,
        subdomain: clients.subdomain,
        portalAccessEnabled: clients.portalAccessEnabled,
        portalInviteSent: clients.portalInviteSent,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .where(and(
        eq(clients.id, clientId),
        eq(clients.agencyId, agencyId)
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client,
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'client.view',
  }
);

// PUT /api/clients/[id] - Update client
export const PUT = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId, params } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { id: clientId } = params;
    if (!db) { return NextResponse.json({ error: "Database connection failed" }, { status: 500 }); }
    const updateData = await request.json();

    // Verify client belongs to agency
    const existingClient = await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.id, clientId),
        eq(clients.agencyId, agencyId)
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Update client
    const updatedClient = await db
      .update(clients)
      .set({
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        industry: updateData.industry,
        subdomain: updateData.subdomain,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId))
      .returning({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        industry: clients.industry,
        subdomain: clients.subdomain,
        updatedAt: clients.updatedAt,
      })
      .then((r: any[]) => r[0]);

    return NextResponse.json({
      success: true,
      client: updatedClient,
      message: 'Client updated successfully',
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'client.update',
  }
);

// DELETE /api/clients/[id] - Delete client
export const DELETE = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId, params } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { id: clientId } = params;
    if (!db) { return NextResponse.json({ error: "Database connection failed" }, { status: 500 }); }

    // Verify client belongs to agency
    const existingClient = await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.id, clientId),
        eq(clients.agencyId, agencyId)
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete client
    await db.delete(clients).where(eq(clients.id, clientId));

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'client.delete',
  }
);
