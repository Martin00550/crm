import { pgTable, text, timestamp, integer, uuid, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name'),
  workosUserId: text('workos_user_id').unique(),
  agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'set null' }),
  role: text('role').default('agent').notNull(),
  dashboardLayout: jsonb('dashboard_layout'),
  dashboardLayoutVersion: integer('dashboard_layout_version').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  agencyIdIdx: index('agency_id_idx').on(table.agencyId),
  roleIdx: index('users_role_idx').on(table.role),
  deletedAtIdx: index('users_deleted_at_idx').on(table.deletedAt),
  workosUserIdIdx: index('users_workos_user_id_idx').on(table.workosUserId),
}));

export const usersRelations = relations(users, ({ one }) => ({
  agency: one(agencies, {
    fields: [users.agencyId],
    references: [agencies.id],
  }),
}));
