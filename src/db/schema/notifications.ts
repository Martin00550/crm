import { pgTable, text, timestamp, boolean, uuid, index, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  read: boolean('read').default(false).notNull(),
  metadata: jsonb('metadata'),
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

export const notificationSettings = pgTable('notification_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  email90Day: boolean('email_90_day').default(true).notNull(),
  email60Day: boolean('email_60_day').default(true).notNull(),
  email30Day: boolean('email_30_day').default(true).notNull(),
  pushNotifications: boolean('push_notifications').default(false).notNull(),
  pushEnabled: boolean('push_enabled').default(false).notNull(),
  pushSubscription: jsonb('push_subscription'),
  weeklyReports: boolean('weekly_reports').default(true).notNull(),
  weeklyReportDay: integer('weekly_report_day').default(1),
  autoRenewalAlerts: boolean('auto_renewal_alerts').default(true).notNull(),
  autoRenewalDays: integer('auto_renewal_days').default(30).notNull(),
  commissionAlerts: boolean('commission_alerts').default(true).notNull(),
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

// Added integer import
import { integer } from 'drizzle-orm/pg-core';
