import { pgTable, text, timestamp, boolean, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { agencies } from './agencies';
import { policies } from './policies';
import { messages } from './system';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  industry: text('industry'),
  subdomain: text('subdomain').unique(), // For RetainVault Magic Link (e.g. acmeconstruction.retainvault.com)
  portalAccessEnabled: boolean('portal_access_enabled').default(false),
  portalInviteSent: boolean('portal_invite_sent').default(false),
  portalInviteSentAt: timestamp('portal_invite_sent_at'),
  portalToken: text('portal_token'),
  portalTokenExpires: timestamp('portal_token_expires'),
  portalPasswordHash: text('portal_password'),
  portalLastLogin: timestamp('portal_last_login'),
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
