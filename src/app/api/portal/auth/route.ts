import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, agencies, rateLimits } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sign, verify } from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { hash, compare } from 'bcryptjs';

// Validation schema for portal auth
const portalAuthSchema = z.object({
  subdomain: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(100).optional(),
  mode: z.enum(['login', 'reset']).optional(),
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Rate limiting: 5 attempts per IP per 15 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

async function checkRateLimit(ip: string, email: string): Promise<boolean> {
  if (!db) return true; // Allow if no database (demo mode)

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

  // Clean up old entries
  await db
    .delete(rateLimits)
    .where(gt(rateLimits.resetAt, windowStart));

  // Check current attempt count
  const key = `portal_login:${ip}:${email}`;
  const [existing] = await db
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.key, key))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!existing) {
    // First attempt
    await db.insert(rateLimits).values({
      key,
      count: 1,
      resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
    });
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return false; // Rate limited
  }

  // Increment count
  await db
    .update(rateLimits)
    .set({ count: existing.count + 1 })
    .where(eq(rateLimits.key, key));

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = portalAuthSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { subdomain, email, password, mode } = validationResult.data;

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Apply rate limiting for login mode
    if (mode === 'login' && password) {
      const allowed = await checkRateLimit(ip, email);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Get agency by subdomain
    const agency = await db
      .select()
      .from(agencies)
      .where(eq(agencies.subdomain, subdomain))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!agency || !agency.whiteLabelEnabled || agency.subscriptionTier !== 'enterprise') {
      return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
    }

    // Password reset mode
    if (mode === 'reset') {
      const client = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.email, email),
            eq(clients.agencyId, agency.id),
            eq(clients.portalAccessEnabled, true)
          )
        )
        .limit(1)
        .then((r: any[]) => r[0]);

      if (!client) {
        // Don't reveal if email exists or not
        return NextResponse.json({ success: true });
      }

      // In production, send password reset email via Resend
      // For now, just return success
      return NextResponse.json({ success: true });
    }

    // Login mode
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    // Find client
    const client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.email, email),
          eq(clients.agencyId, agency.id),
          eq(clients.portalAccessEnabled, true)
        )
      )
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!client) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password using bcrypt
    // If client has no hashed password (legacy), hash it now
    let hashedPassword = client.portalPassword;
    if (!hashedPassword) {
      // Legacy: hash the password for future use
      hashedPassword = await hash(password, 12);
      await db
        .update(clients)
        .set({ portalPassword: hashedPassword })
        .where(eq(clients.id, client.id));
      // Allow first-time login with the provided password
    } else {
      // Verify the password against the hash
      const isValid = await compare(password, hashedPassword);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // Update last login
    await db
      .update(clients)
      .set({ portalLastLogin: new Date() })
      .where(eq(clients.id, client.id));

    // Generate JWT token
    const token = sign(
      {
        clientId: client.id,
        agencyId: agency.id,
        email: client.email,
        subdomain,
      },
      JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Set cookie and return success
    const response = NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
    });

    response.cookies.set('portal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Portal auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('portal_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET!) as unknown as {
      clientId: string;
      agencyId: string;
      email: string;
      subdomain: string;
    };

    // Get client data
    const client = await db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        agencyId: clients.agencyId,
      })
      .from(clients)
      .where(eq(clients.id, decoded.clientId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!client) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      client,
      subdomain: decoded.subdomain,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('portal_token');
  return response;
}
