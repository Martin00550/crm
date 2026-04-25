/**
 * Billing management library
 * Handles invoices, payments, and subscription history
 */

import { db } from '@/lib/db';
import { invoices, payments, subscriptionHistory, agencies } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Create a new invoice
export async function createInvoice(data: {
  agencyId: string;
  paddleInvoiceId?: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  dueDate?: Date;
  lineItems?: { description: string; amount: number; quantity: number }[];
}) {
  if (!db) throw new Error('Database not connected');

  const [invoice] = await db
    .insert(invoices)
    .values({
      agencyId: data.agencyId,
      paddleInvoiceId: data.paddleInvoiceId,
      subscriptionId: data.subscriptionId,
      amount: String(data.amount),
      currency: data.currency || 'USD',
      billingPeriodStart: data.billingPeriodStart,
      billingPeriodEnd: data.billingPeriodEnd,
      dueDate: data.dueDate,
      lineItems: data.lineItems || [],
      status: 'pending',
    })
    .returning();

  return invoice;
}

// Record a payment
export async function recordPayment(data: {
  agencyId: string;
  invoiceId?: string;
  paddleTransactionId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  paidAt?: Date;
  metadata?: Record<string, any>;
}) {
  if (!db) throw new Error('Database not connected');

  const [payment] = await db
    .insert(payments)
    .values({
      agencyId: data.agencyId,
      invoiceId: data.invoiceId,
      paddleTransactionId: data.paddleTransactionId,
      amount: String(data.amount),
      currency: data.currency || 'USD',
      paymentMethod: data.paymentMethod,
      paidAt: data.paidAt || new Date(),
      status: 'completed',
      metadata: data.metadata || {},
    })
    .returning();

  // If invoice is provided, mark it as paid
  if (data.invoiceId) {
    await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAt: data.paidAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, data.invoiceId));
  }

  return payment;
}

// Log subscription change
export async function logSubscriptionChange(data: {
  agencyId: string;
  action: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'reactivated' | 'payment_failed';
  previousTier?: string;
  newTier?: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  performedBy?: string;
  metadata?: Record<string, any>;
}) {
  if (!db) throw new Error('Database not connected');

  const [entry] = await db
    .insert(subscriptionHistory)
    .values({
      agencyId: data.agencyId,
      action: data.action,
      previousTier: data.previousTier,
      newTier: data.newTier,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      reason: data.reason,
      performedBy: data.performedBy,
      metadata: data.metadata || {},
    })
    .returning();

  return entry;
}

// Get invoices for an agency
export async function getAgencyInvoices(agencyId: string, limit = 50) {
  if (!db) return [];

  return db
    .select()
    .from(invoices)
    .where(eq(invoices.agencyId, agencyId))
    .orderBy(desc(invoices.createdAt))
    .limit(limit);
}

// Get payments for an agency
export async function getAgencyPayments(agencyId: string, limit = 50) {
  if (!db) return [];

  return db
    .select()
    .from(payments)
    .where(eq(payments.agencyId, agencyId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

// Get subscription history for an agency
export async function getSubscriptionHistory(agencyId: string, limit = 50) {
  if (!db) return [];

  return db
    .select()
    .from(subscriptionHistory)
    .where(eq(subscriptionHistory.agencyId, agencyId))
    .orderBy(desc(subscriptionHistory.createdAt))
    .limit(limit);
}

// Handle Paddle webhook events
export async function handlePaddleBillingEvent(event: any) {
  if (!db) return;

  const eventType = event.event_type;
  const data = event.data;

  switch (eventType) {
    case 'subscription.created': {
      const agencyId = data.custom_data?.agencyId;
      if (agencyId) {
        await logSubscriptionChange({
          agencyId,
          action: 'created',
          newTier: data.items?.[0]?.price?.custom_data?.tier || 'solo',
          newStatus: 'active',
          reason: 'webhook',
          metadata: { paddleSubscriptionId: data.id },
        });
      }
      break;
    }

    case 'subscription.updated': {
      const agencyId = data.custom_data?.agencyId;
      if (agencyId) {
        const oldTier = data.previous_items?.[0]?.price?.custom_data?.tier;
        const newTier = data.items?.[0]?.price?.custom_data?.tier;
        
        await logSubscriptionChange({
          agencyId,
          action: oldTier && newTier && oldTier !== newTier 
            ? (newTier === 'enterprise' || (oldTier === 'solo' && newTier === 'growth') ? 'upgraded' : 'downgraded')
            : 'reactivated',
          previousTier: oldTier,
          newTier: newTier,
          previousStatus: data.previous_status,
          newStatus: data.status,
          reason: 'webhook',
          metadata: { paddleSubscriptionId: data.id },
        });
      }
      break;
    }

    case 'subscription.cancelled': {
      const agencyId = data.custom_data?.agencyId;
      if (agencyId) {
        await logSubscriptionChange({
          agencyId,
          action: 'cancelled',
          previousStatus: 'active',
          newStatus: 'cancelled',
          reason: 'webhook',
          metadata: { paddleSubscriptionId: data.id },
        });
      }
      break;
    }

    case 'invoice.created': {
      const agencyId = data.custom_data?.agencyId || 
        await getAgencyIdBySubscription(data.subscription_id);
      
      if (agencyId) {
        await createInvoice({
          agencyId,
          paddleInvoiceId: data.id,
          subscriptionId: data.subscription_id,
          amount: data.details?.totals?.total || 0,
          currency: data.currency_code || 'USD',
          billingPeriodStart: data.period_start ? new Date(data.period_start) : undefined,
          billingPeriodEnd: data.period_end ? new Date(data.period_end) : undefined,
          dueDate: data.due_date ? new Date(data.due_date) : undefined,
          lineItems: data.line_items?.map((item: any) => ({
            description: item.description || 'Subscription',
            amount: item.totals?.subtotal || 0,
            quantity: item.quantity || 1,
          })),
        });
      }
      break;
    }

    case 'invoice.paid': {
      const agencyId = data.custom_data?.agencyId ||
        await getAgencyIdBySubscription(data.subscription_id);
      
      if (agencyId) {
        // Find the invoice
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.paddleInvoiceId, data.id))
          .limit(1);

        await recordPayment({
          agencyId,
          invoiceId: invoice?.id,
          paddleTransactionId: data.transactions?.[0]?.id,
          amount: data.details?.totals?.total || 0,
          currency: data.currency_code || 'USD',
          paymentMethod: data.payments?.[0]?.method_details?.type,
          paidAt: new Date(),
        });
      }
      break;
    }

    case 'subscription.payment_failed': {
      const agencyId = data.custom_data?.agencyId;
      if (agencyId) {
        await logSubscriptionChange({
          agencyId,
          action: 'payment_failed',
          reason: 'webhook',
          metadata: { 
            paddleSubscriptionId: data.id,
            error: data.payment?.error,
          },
        });
      }
      break;
    }
  }
}

// Helper to find agency by subscription ID
async function getAgencyIdBySubscription(subscriptionId: string): Promise<string | null> {
  if (!db) return null;

  const [agency] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(eq(agencies.paddleSubscriptionId, subscriptionId))
    .limit(1);

  return agency?.id || null;
}
