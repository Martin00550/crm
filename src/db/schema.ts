import { pgTable, text, timestamp, boolean, integer, decimal, uuid, index, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Better Auth user table (required by better-auth)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Better Auth session table
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

// Better Auth account table (for OAuth providers)
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Better Auth verification table
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Application users table (extends Better Auth user with app-specific fields)
// Note: 'user' table is managed by Better Auth for authentication
// 'users' table contains app-specific fields like agencyId, role, etc.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name'),
  betterAuthUserId: text('better_auth_user_id').unique(), // Reference to Better Auth user.id
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'set null' }),
  role: text('role').default('agent').notNull(),
  // Dashboard customization
  dashboardLayout: jsonb('dashboard_layout'), // Stores widget layout configuration
  dashboardLayoutVersion: integer('dashboard_layout_version').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  agencyIdIdx: index('agency_id_idx').on(table.agencyId),
  roleIdx: index('users_role_idx').on(table.role),
  deletedAtIdx: index('users_deleted_at_idx').on(table.deletedAt),
  betterAuthUserIdIdx: index('users_better_auth_user_id_idx').on(table.betterAuthUserId),
}));

export const usersRelations = relations(users, ({ one }) => ({
  agency: one(agencies, {
    fields: [users.agencyId],
    references: [agencies.id],
  }),
}));

export const agencies = pgTable('agencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subdomain: text('subdomain').unique(),
  // Payment processor IDs (Paddle)
  // Note: Field names use 'stripe' prefix for backward compatibility
  // These store Paddle customer and subscription IDs
  paddleCustomerId: text('paddle_customer_id'), // Paddle customer ID
  paddleSubscriptionId: text('paddle_subscription_id'), // Paddle subscription ID
  subscriptionTier: text('subscription_tier').default('solo'),
  subscriptionStatus: text('subscription_status').default('trialing'),
  // Trial period
  trialEnd: timestamp('trial_end'),
  // Branding configuration
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

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  industry: text('industry'),
  // Portal authentication
  portalAccessEnabled: boolean('portal_access_enabled').default(false),
  portalInviteSent: boolean('portal_invite_sent').default(false),
  portalInviteSentAt: timestamp('portal_invite_sent_at'),
  portalToken: text('portal_token'),
  portalTokenExpires: timestamp('portal_token_expires'),
  portalPassword: text('portal_password'), // Hashed password for portal access
  portalLastLogin: timestamp('portal_last_login'),
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  agencyIdIdx: index('clients_agency_idx').on(table.agencyId),
  deletedAtIdx: index('clients_deleted_at_idx').on(table.deletedAt),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [clients.agencyId],
    references: [agencies.id],
  }),
  policies: many(policies),
  messages: many(messages),
}));

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
  // Soft delete
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

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull(),
  status: text('status').default('pending'), // pending, accepted, expired, cancelled
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

export const renewals = pgTable('renewals', {
  id: uuid('id').primaryKey().defaultRandom(),
  policyId: uuid('policy_id').notNull().references(() => policies.id, { onDelete: 'cascade' }),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  renewalDate: timestamp('renewal_date').notNull(),
  status: text('status').default('pending'),
  // 90-day notification
  notification90Sent: boolean('notification_90_sent').default(false),
  notification90SentAt: timestamp('notification_90_sent_at'),
  // 60-day notification
  notification60Sent: boolean('notification_60_sent').default(false),
  notification60SentAt: timestamp('notification_60_sent_at'),
  // 30-day notification
  notification30Sent: boolean('notification_30_sent').default(false),
  notification30SentAt: timestamp('notification_30_sent_at'),
  // AI Report
  aiReportGenerated: boolean('ai_report_generated').default(false),
  aiReportSent: boolean('ai_report_sent').default(false),
  // Tracking
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

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  policyId: uuid('policy_id').references(() => policies.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  filePath: text('file_path').notNull(),
  fileUrl: text('file_url'),
  description: text('description'),
  category: text('category').default('other'), // 'policy', 'client', 'commission', 'other'
  type: text('type').default('other'), // 'certificate', 'policy', 'endorsement', 'invoice', 'other'
  // Version control
  documentId: uuid('document_id'), // Parent document ID for versioning
  version: integer('version').default(1),
  currentVersion: integer('current_version').default(1),
  changeNotes: text('change_notes'),
  isPublic: boolean('is_public').default(false),
  downloadCount: integer('download_count').default(0),
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  agencyIdIdx: index('documents_agency_idx').on(table.agencyId),
  policyIdIdx: index('documents_policy_idx').on(table.policyId),
  clientIdIdx: index('documents_client_idx').on(table.clientId),
  uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedBy),
  categoryIdx: index('documents_category_idx').on(table.category),
  documentIdIdx: index('documents_document_id_idx').on(table.documentId),
  versionIdx: index('documents_version_idx').on(table.documentId, table.version),
  // Ensure at least one association exists
  documentAssociationCheck: index('documents_association_check').on(table.policyId, table.clientId),
  deletedAtIdx: index('documents_deleted_at_idx').on(table.deletedAt),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  policy: one(policies, {
    fields: [documents.policyId],
    references: [policies.id],
  }),
  agency: one(agencies, {
    fields: [documents.agencyId],
    references: [agencies.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  versions: many(documents, {
    relationName: 'documentVersions',
  }),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'info', 'warning', 'success', 'error'
  read: boolean('read').default(false).notNull(),
  metadata: jsonb('metadata'), // Additional data like policyId, clientId, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  notificationsIndex: index('notifications_index').on(table.agencyId, table.userId, table.createdAt),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  agency: one(agencies, {
    fields: [notifications.agencyId],
    references: [agencies.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
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

export const notificationSettings = pgTable('notification_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  // Email notifications
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  email90Day: boolean('email_90_day').default(true).notNull(),
  email60Day: boolean('email_60_day').default(true).notNull(),
  email30Day: boolean('email_30_day').default(true).notNull(),
  // Push notifications
  pushNotifications: boolean('push_notifications').default(false).notNull(),
  pushEnabled: boolean('push_enabled').default(false).notNull(),
  pushSubscription: jsonb('push_subscription'), // Web Push subscription object
  // Reports
  weeklyReports: boolean('weekly_reports').default(true).notNull(),
  weeklyReportDay: integer('weekly_report_day').default(1), // 0=Sunday, 1=Monday, etc.
  autoRenewalAlerts: boolean('auto_renewal_alerts').default(true).notNull(),
  autoRenewalDays: integer('auto_renewal_days').default(30).notNull(), // Alert X days before
  commissionAlerts: boolean('commission_alerts').default(true).notNull(),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agencyUserIdx: index('notification_settings_agency_user_idx').on(table.agencyId, table.userId),
  agencyUserUnique: unique('notification_settings_agency_user_unique').on(table.agencyId, table.userId),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  agency: one(agencies, {
    fields: [notificationSettings.agencyId],
    references: [agencies.id],
  }),
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

// AI Chat logs for rate limiting
export const aiChatLogs = pgTable('ai_chat_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  messageCount: integer('message_count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('ai_chat_logs_user_idx').on(table.userId),
  createdAtIdx: index('ai_chat_logs_created_at_idx').on(table.createdAt),
}));

// Rate limiting table
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  resetAt: timestamp('reset_at').notNull(),
}, (table) => ({
  resetAtIdx: index('rate_limits_reset_at_idx').on(table.resetAt),
}));

// Billing - Invoices for subscription tracking
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  paddleInvoiceId: text('paddle_invoice_id').unique(), // Paddle's invoice ID
  subscriptionId: text('subscription_id'), // Paddle subscription ID
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('pending').notNull(), // pending, paid, failed, refunded
  billingPeriodStart: timestamp('billing_period_start'),
  billingPeriodEnd: timestamp('billing_period_end'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  invoiceUrl: text('invoice_url'), // Link to PDF invoice
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

// Billing - Payments for transaction history
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  paddleTransactionId: text('paddle_transaction_id').unique(), // Paddle's transaction ID
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('pending').notNull(), // pending, completed, failed, refunded
  paymentMethod: text('payment_method'), // card, paypal, etc.
  paidAt: timestamp('paid_at'),
  refundedAt: timestamp('refunded_at'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  metadata: jsonb('metadata'), // Additional payment details
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

// Subscription history for audit trail
export const subscriptionHistory = pgTable('subscription_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // created, upgraded, downgraded, cancelled, reactivated
  previousTier: text('previous_tier'),
  newTier: text('new_tier'),
  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  reason: text('reason'), // manual, webhook, admin
  performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }), // User who made the change
  metadata: jsonb('metadata'), // Additional context
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

// Backups table for tracking backup history
export const backups = pgTable('backups', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  backupId: text('backup_id').notNull().unique(),
  size: integer('size').notNull(),
  location: text('location').notNull(),
  status: text('status').default('completed'), // 'completed', 'failed', 'in_progress'
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

// Audit logs table for security-sensitive operations
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

// Security alerts table for suspicious activity
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
