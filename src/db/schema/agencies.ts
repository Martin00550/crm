import { pgTable, text, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { clients } from './clients';
import { policies } from './policies';
import { renewals } from './renewals';
import { commissions } from './commissions';
import { documents } from './documents';
import { invitations, messages, featureUsage } from './system';
import { notifications } from './notifications';
import { invoices, payments, subscriptionHistory } from './billing';
import { backups } from './system';

export const agencies = pgTable('agencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subdomain: text('subdomain').unique(),
  paddleCustomerId: text('paddle_customer_id'),
  paddleSubscriptionId: text('paddle_subscription_id'),
  subscriptionTier: text('subscription_tier').default('solo'),
  subscriptionStatus: text('subscription_status').default('trialing'),
  trialEnd: timestamp('trial_end'),
  branding: jsonb('branding').$type<{
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    faviconUrl?: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    businessHours?: string;
  }>().default({
    primaryColor: '#1e40af',
    secondaryColor: '#7c3aed',
  }),
  whiteLabelEnabled: boolean('white_label_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const agenciesRelations = relations(agencies, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  policies: many(policies),
  renewals: many(renewals),
  commissions: many(commissions),
  documents: many(documents),
  invitations: many(invitations),
  notifications: many(notifications),
  featureUsage: many(featureUsage),
  invoices: many(invoices),
  payments: many(payments),
  subscriptionHistory: many(subscriptionHistory),
  backups: many(backups),
}));
