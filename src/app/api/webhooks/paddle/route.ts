import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/paddle';
import crypto from 'crypto';

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;

/**
 * Verify Paddle webhook signature
 * Paddle v2 uses HMAC-SHA256 with format: eventId:timestamp:body
 * https://developer.paddle.com/webhooks/verify-signature
 */
function verifyPaddleSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  eventId: string
): boolean {
  try {
    // Paddle sends signatures in format: ts=timestamp;h1=signature
    const parts = signatureHeader.split(';');
    let timestamp = '';
    let signature = '';
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') timestamp = value;
      if (key === 'h1') signature = value;
    }
    
    if (!timestamp || !signature) {
      console.error('Invalid signature format');
      return false;
    }
    
    // Check timestamp to prevent replay attacks (5 minute window)
    const timestampMs = parseInt(timestamp) * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (Math.abs(now - timestampMs) > fiveMinutes) {
      console.error('Webhook timestamp expired');
      return false;
    }
    
    // Paddle v2 signed payload format: eventId:timestamp:body
    const signedPayload = `${eventId}:${timestamp}:${payload}`;
    
    // Compute expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get signature header
    const signatureHeader = request.headers.get('paddle-signature');
    
    if (!PADDLE_WEBHOOK_SECRET) {
      console.error('PADDLE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // Require signature in production
    if (!signatureHeader) {
      console.error('Missing Paddle webhook signature');
      
      // Only allow missing signature in development with explicit flag
      if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_UNSIGNED_WEBHOOKS !== 'true') {
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }
      
      console.warn('WARNING: Processing unsigned webhook (development only)');
    } else {
      // Parse body to get event_id for signature verification
      const parsedBody = JSON.parse(rawBody);
      const eventId = parsedBody.id || parsedBody.event_id;
      
      if (!eventId) {
        console.error('Missing event ID in webhook payload');
        return NextResponse.json(
          { error: 'Invalid webhook payload: missing event ID' },
          { status: 400 }
        );
      }
      
      // Verify signature with eventId
      const isValid = verifyPaddleSignature(
        rawBody,
        signatureHeader,
        PADDLE_WEBHOOK_SECRET,
        eventId
      );
      
      if (!isValid) {
        console.error('Invalid Paddle webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    // Parse verified body
    const body = JSON.parse(rawBody);
    
    // Validate webhook payload structure
    if (!body.event_type || !body.data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }
    
    // Log webhook event for audit trail
    console.log(`Paddle webhook received: ${body.event_type}`, {
      eventId: body.id,
      timestamp: new Date().toISOString(),
    });
    
    // Handle the webhook event
    await handleWebhook(body);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paddle webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
