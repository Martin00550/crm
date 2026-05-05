import { pgTable, text, timestamp, integer, decimal, uuid, index, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { clients } from './clients';
import { agencies } from './agencies';
import { renewals } from './renewals';
import { commissions } from './commissions';
import { documents } from './documents';

export const policies = pgTable('policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  policyNumber: text('policy_number').notNull(),
  carrier: text('carrier').notNull(),
  policyType: text('policy_type').notNull(),
  premium: decimal('premium', { precision: 10, scale: 2 }).notNull(),
  currentTermPremium: decimal('current_term_premium', { precision: 10, scale: 2 }),
  previousTermPremium: decimal('previous_term_premium', { precision: 10, scale: 2 }),
  effectiveDate: timestamp('effective_date').notNull(),
  expirationDate: timestamp('expiration_date').notNull(),
  status: text('status').default('active'),
  healthScore: integer('health_score'),
  healthStatus: text('health_status').default('unknown'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clientIdIdx: index('policies_client_idx').on(table.clientId),
  agencyIdIdx: index('policies_agency_idx').on(table.agencyId),
  expirationIdx: index('policies_expiration_idx').on(table.expirationDate),
  statusIdx: index('policies_status_idx').on(table.status),
  agencyPolicyUnique: unique('policies_agency_policy_number_unique').on(table.agencyId, table.policyNumber),
  deletedAtIdx: index('policies_deleted_at_idx').on(table.deletedAt),
  // New composite indexes for performance optimization
  agencyStatusIdx: index('policies_agency_status_idx').on(table.agencyId, table.status),
  agencyStatusExpirationIdx: index('policies_agency_status_exp_idx').on(table.agencyId, table.status, table.expirationDate),
  agencyStatusHealthIdx: index('policies_agency_status_health_idx').on(table.agencyId, table.status, table.healthStatus),
}));

export const policiesRelations = relations(policies, ({ one, many }) => ({
  client: one(clients, {
    fields: [policies.clientId],
    references: [clients.id],
  }),
  agency: one(agencies, {
    fields: [policies.agencyId],
    references: [agencies.id],
  }),
  renewals: many(renewals),
  commissions: many(commissions),
  documents: many(documents),
}));
