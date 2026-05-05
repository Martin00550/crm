import { pgTable, text, timestamp, boolean, uuid, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { policies } from './policies';
import { agencies } from './agencies';

export const renewals = pgTable('renewals', {
  id: uuid('id').primaryKey().defaultRandom(),
  policyId: uuid('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  renewalDate: timestamp('renewal_date').notNull(),
  status: text('status').default('pending'),
  notification90Sent: boolean('notification_90_sent').default(false),
  notification90SentAt: timestamp('notification_90_sent_at'),
  notification60Sent: boolean('notification_60_sent').default(false),
  notification60SentAt: timestamp('notification_60_sent_at'),
  notification30Sent: boolean('notification_30_sent').default(false),
  notification30SentAt: timestamp('notification_30_sent_at'),
  aiReportGenerated: boolean('ai_report_generated').default(false),
  aiReportSent: boolean('ai_report_sent').default(false),
  clientResponseAt: timestamp('client_response_at'),
  renewalCompletedAt: timestamp('renewal_completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  policyIdIdx: index('renewals_policy_idx').on(table.policyId),
  renewalDateIdx: index('renewals_date_idx').on(table.renewalDate),
  agencyDateIdx: index('renewals_agency_date_idx').on(table.agencyId, table.renewalDate),
  policyUnique: unique('renewals_policy_unique').on(table.policyId),
}));

export const renewalsRelations = relations(renewals, ({ one }) => ({
  policy: one(policies, {
    fields: [renewals.policyId],
    references: [policies.id],
  }),
  agency: one(agencies, {
    fields: [renewals.agencyId],
    references: [agencies.id],
  }),
}));
