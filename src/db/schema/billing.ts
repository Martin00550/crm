import { pgTable, text, timestamp, decimal, uuid, index, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';
import { users } from './users';

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  paddleInvoiceId: text('paddle_invoice_id').unique(),
  subscriptionId: text('subscription_id'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('pending').notNull(),
  billingPeriodStart: timestamp('billing_period_start'),
  billingPeriodEnd: timestamp('billing_period_end'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  invoiceUrl: text('invoice_url'),
  lineItems: jsonb('line_items').$type<{
    description: string;
    amount: number;
    quantity: number;
  }[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdIdx: index('invoices_agency_idx').on(table.agencyId),
  paddleInvoiceIdx: index('invoices_paddle_idx').on(table.paddleInvoiceId),
  statusIdx: index('invoices_status_idx').on(table.status),
  createdAtIdx: index('invoices_created_at_idx').on(table.createdAt),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  agency: one(agencies, {
    fields: [invoices.agencyId],
    references: [agencies.id],
  }),
}));

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  paddleTransactionId: text('paddle_transaction_id').unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('pending').notNull(),
  paymentMethod: text('payment_method'),
  paidAt: timestamp('paid_at'),
  refundedAt: timestamp('refunded_at'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdIdx: index('payments_agency_idx').on(table.agencyId),
  invoiceIdIdx: index('payments_invoice_idx').on(table.invoiceId),
  paddleTransactionIdx: index('payments_paddle_idx').on(table.paddleTransactionId),
  statusIdx: index('payments_status_idx').on(table.status),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  agency: one(agencies, {
    fields: [payments.agencyId],
    references: [agencies.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const subscriptionHistory = pgTable('subscription_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  previousTier: text('previous_tier'),
  newTier: text('new_tier'),
  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  reason: text('reason'),
  performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdIdx: index('subscription_history_agency_idx').on(table.agencyId),
  actionIdx: index('subscription_history_action_idx').on(table.action),
  createdAtIdx: index('subscription_history_created_at_idx').on(table.createdAt),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  agency: one(agencies, {
    fields: [subscriptionHistory.agencyId],
    references: [agencies.id],
  }),
  performer: one(users, {
    fields: [subscriptionHistory.performedBy],
    references: [users.id],
  }),
}));
