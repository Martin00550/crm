import { pgTable, text, timestamp, boolean, integer, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { policies } from './policies';
import { agencies } from './agencies';
import { users } from './users';
import { clients } from './clients';

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
  category: text('category').default('other'),
  type: text('type').default('other'),
  documentId: uuid('document_id'),
  version: integer('version').default(1),
  currentVersion: integer('current_version').default(1),
  changeNotes: text('change_notes'),
  isPublic: boolean('is_public').default(false),
  downloadCount: integer('download_count').default(0),
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
