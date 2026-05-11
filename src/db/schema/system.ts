import { pgTable, text, timestamp, boolean, integer, uuid, index, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';
import { users } from './users';
import { clients } from './clients';

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull(),
  status: text('status').default('pending'),
  token: text('token').unique().notNull(),
  sentAt: timestamp('sent_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  agencyIdIdx: index('invitations_agency_idx').on(table.agencyId),
  emailIdx: index('invitations_email_idx').on(table.email),
  tokenIdx: index('invitations_token_idx').on(table.token),
  statusIdx: index('invitations_status_idx').on(table.status),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  agency: one(agencies, {
    fields: [invitations.agencyId],
    references: [agencies.id],
  }),
}));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  direction: text('direction').notNull(),
  channel: text('channel').default('sms'),
  content: text('content').notNull(),
  from: text('from'),
  to: text('to'),
  twilioSid: text('twilio_sid'),
  status: text('status').default('received'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clientIdIdx: index('messages_client_idx').on(table.clientId),
  agencyIdIdx: index('messages_agency_idx').on(table.agencyId),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  client: one(clients, {
    fields: [messages.clientId],
    references: [clients.id],
  }),
  agency: one(agencies, {
    fields: [messages.agencyId],
    references: [agencies.id],
  }),
}));

export const featureUsage = pgTable('feature_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  featureKey: text('feature_key').notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  billingPeriodStart: timestamp('billing_period_start').notNull(),
  billingPeriodEnd: timestamp('billing_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  agencyFeatureIdx: index('feature_usage_agency_feature_idx').on(table.agencyId, table.featureKey),
  billingPeriodIdx: index('feature_usage_billing_period_idx').on(table.billingPeriodStart, table.billingPeriodEnd),
  agencyPeriodUnique: unique('feature_usage_agency_feature_period_unique').on(table.agencyId, table.featureKey, table.billingPeriodStart),
}));

export const featureUsageRelations = relations(featureUsage, ({ one }) => ({
  agency: one(agencies, {
    fields: [featureUsage.agencyId],
    references: [agencies.id],
  }),
}));

export const aiChatLogs = pgTable('ai_chat_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  messageCount: integer('message_count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('ai_chat_logs_user_idx').on(table.userId),
  createdAtIdx: index('ai_chat_logs_created_at_idx').on(table.createdAt),
}));

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  resetAt: timestamp('reset_at').notNull(),
}, (table) => ({
  resetAtIdx: index('rate_limits_reset_at_idx').on(table.resetAt),
}));

export const backups = pgTable('backups', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  backupId: text('backup_id').notNull().unique(),
  size: integer('size').notNull(),
  location: text('location').notNull(),
  status: text('status').default('completed'),
  duration: integer('duration'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  agencyIdIdx: index('backups_agency_idx').on(table.agencyId),
  backupIdIdx: index('backups_backup_id_idx').on(table.backupId),
  statusIdx: index('backups_status_idx').on(table.status),
  expiresAtIdx: index('backups_expires_at_idx').on(table.expiresAt),
}));

export const backupsRelations = relations(backups, ({ one }) => ({
  agency: one(agencies, {
    fields: [backups.agencyId],
    references: [agencies.id],
  }),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  details: jsonb('details'),
  status: text('status').notNull().default('success'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  agencyIdIdx: index('audit_logs_agency_idx').on(table.agencyId),
  userIdIdx: index('audit_logs_user_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  createdAtIdx: index('audit_logs_created_idx').on(table.createdAt),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  agency: one(agencies, {
    fields: [auditLogs.agencyId],
    references: [agencies.id],
  }),
}));

export const securityAlerts = pgTable('security_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  severity: text('severity').notNull(),
  userId: text('user_id'),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  details: jsonb('details'),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: text('resolved_by'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  agencyIdIdx: index('security_alerts_agency_idx').on(table.agencyId),
  severityIdx: index('security_alerts_severity_idx').on(table.severity),
  resolvedIdx: index('security_alerts_resolved_idx').on(table.resolved),
  createdAtIdx: index('security_alerts_created_idx').on(table.createdAt),
}));

export const securityAlertsRelations = relations(securityAlerts, ({ one }) => ({
  agency: one(agencies, {
    fields: [securityAlerts.agencyId],
    references: [agencies.id],
  }),
}));

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  fileName: text('file_name'),
  status: text('status').default('pending'), // pending, processing, completed, failed
  totalRows: integer('total_rows').default(0),
  processedRows: integer('processed_rows').default(0),
  successCount: integer('success_count').default(0),
  errorCount: integer('error_count').default(0),
  errorDetails: jsonb('error_details'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  agencyIdIdx: index('import_jobs_agency_idx').on(table.agencyId),
  statusIdx: index('import_jobs_status_idx').on(table.status),
}));

export const importJobsRelations = relations(importJobs, ({ one }) => ({
  agency: one(agencies, {
    fields: [importJobs.agencyId],
    references: [agencies.id],
  }),
}));
