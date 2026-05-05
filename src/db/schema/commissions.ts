import { pgTable, text, timestamp, decimal, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { policies } from './policies';
import { agencies } from './agencies';
import { users } from './users';

export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  policyId: uuid('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => users.id, { onDelete: 'set null' }),
  totalPremium: decimal('total_premium', { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).notNull(),
  agentSplit: decimal('agent_split', { precision: 5, scale: 2 }).default('70'),
  agentCommission: decimal('agent_commission', { precision: 10, scale: 2 }),
  carrierPayoutStatus: text('carrier_payout_status').default('pending'),
  carrierPayoutDate: timestamp('carrier_payout_date'),
  period: text('period'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  policyIdIdx: index('commissions_policy_idx').on(table.policyId),
  agentIdIdx: index('commissions_agent_idx').on(table.agentId),
  agencyIdIdx: index('commissions_agency_idx').on(table.agencyId),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  policy: one(policies, {
    fields: [commissions.policyId],
    references: [policies.id],
  }),
  agent: one(users, {
    fields: [commissions.agentId],
    references: [users.id],
  }),
  agency: one(agencies, {
    fields: [commissions.agencyId],
    references: [agencies.id],
  }),
}));
