CREATE TABLE "backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"backup_id" text NOT NULL,
	"size" integer NOT NULL,
	"location" text NOT NULL,
	"status" text DEFAULT 'completed',
	"duration" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "backups_backup_id_unique" UNIQUE("backup_id")
);
--> statement-breakpoint
ALTER TABLE "ai_chat_logs" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ai_chat_logs" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ALTER COLUMN "agent_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "uploaded_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "uploaded_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_settings" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notification_settings" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_history" ALTER COLUMN "performed_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "type" text DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "current_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "change_notes" text;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "commission_alerts" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "better_auth_user_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dashboard_layout" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dashboard_layout_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backups_agency_idx" ON "backups" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "backups_backup_id_idx" ON "backups" USING btree ("backup_id");--> statement-breakpoint
CREATE INDEX "backups_status_idx" ON "backups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "backups_expires_at_idx" ON "backups" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "documents_document_id_idx" ON "documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_version_idx" ON "documents" USING btree ("document_id","version");--> statement-breakpoint
CREATE INDEX "users_better_auth_user_id_idx" ON "users" USING btree ("better_auth_user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_better_auth_user_id_unique" UNIQUE("better_auth_user_id");