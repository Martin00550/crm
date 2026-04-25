CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subdomain" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_tier" text DEFAULT 'solo',
	"subscription_status" text DEFAULT 'active',
	"branding" jsonb DEFAULT '{"primaryColor":"#1e40af","secondaryColor":"#7c3aed"}'::jsonb,
	"white_label_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agencies_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"industry" text,
	"portal_access_enabled" boolean DEFAULT false,
	"portal_invite_sent" boolean DEFAULT false,
	"portal_invite_sent_at" timestamp,
	"portal_token" text,
	"portal_token_expires" timestamp,
	"portal_last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"agent_id" uuid,
	"total_premium" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"agent_split" numeric(5, 2) DEFAULT '70',
	"agent_commission" numeric(10, 2),
	"carrier_payout_status" text DEFAULT 'pending',
	"carrier_payout_date" timestamp,
	"period" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"policy_id" uuid,
	"client_id" uuid,
	"uploaded_by" uuid NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"file_url" text,
	"description" text,
	"category" text DEFAULT 'other',
	"is_public" boolean DEFAULT false,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_usage_agency_feature_period_unique" UNIQUE("agency_id","feature_key","billing_period_start")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text NOT NULL,
	"status" text DEFAULT 'pending',
	"token" text NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"channel" text DEFAULT 'sms',
	"content" text NOT NULL,
	"from" text,
	"to" text,
	"twilio_sid" text,
	"status" text DEFAULT 'received',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"email_90_day" boolean DEFAULT true NOT NULL,
	"email_60_day" boolean DEFAULT true NOT NULL,
	"email_30_day" boolean DEFAULT true NOT NULL,
	"push_notifications" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"push_subscription" jsonb,
	"weekly_reports" boolean DEFAULT true NOT NULL,
	"weekly_report_day" integer DEFAULT 1,
	"auto_renewal_alerts" boolean DEFAULT true NOT NULL,
	"auto_renewal_days" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_agency_user_unique" UNIQUE("agency_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"policy_number" text NOT NULL,
	"carrier" text NOT NULL,
	"policy_type" text NOT NULL,
	"premium" numeric(10, 2) NOT NULL,
	"current_term_premium" numeric(10, 2),
	"previous_term_premium" numeric(10, 2),
	"effective_date" timestamp NOT NULL,
	"expiration_date" timestamp NOT NULL,
	"status" text DEFAULT 'active',
	"health_score" integer,
	"health_status" text DEFAULT 'unknown',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "policies_agency_policy_number_unique" UNIQUE("agency_id","policy_number")
);
--> statement-breakpoint
CREATE TABLE "renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"renewal_date" timestamp NOT NULL,
	"days_out" integer,
	"status" text DEFAULT 'pending',
	"notification_90_sent" boolean DEFAULT false,
	"notification_90_sent_at" timestamp,
	"notification_60_sent" boolean DEFAULT false,
	"notification_60_sent_at" timestamp,
	"notification_30_sent" boolean DEFAULT false,
	"notification_30_sent_at" timestamp,
	"ai_report_generated" boolean DEFAULT false,
	"ai_report_sent" boolean DEFAULT false,
	"client_response_at" timestamp,
	"renewal_completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "renewals_policy_unique" UNIQUE("policy_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'agent',
	"agency_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_agency_idx" ON "clients" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "commissions_policy_idx" ON "commissions" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "commissions_agent_idx" ON "commissions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "commissions_agency_idx" ON "commissions" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "documents_agency_idx" ON "documents" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "documents_policy_idx" ON "documents" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "documents_client_idx" ON "documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "documents_category_idx" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "feature_usage_agency_feature_idx" ON "feature_usage" USING btree ("agency_id","feature_key");--> statement-breakpoint
CREATE INDEX "feature_usage_billing_period_idx" ON "feature_usage" USING btree ("billing_period_start","billing_period_end");--> statement-breakpoint
CREATE INDEX "invitations_agency_idx" ON "invitations" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_client_idx" ON "messages" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "messages_agency_idx" ON "messages" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "notification_settings_agency_user_idx" ON "notification_settings" USING btree ("agency_id","user_id");--> statement-breakpoint
CREATE INDEX "notifications_index" ON "notifications" USING btree ("agency_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "policies_client_idx" ON "policies" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "policies_agency_idx" ON "policies" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "policies_expiration_idx" ON "policies" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "policies_status_idx" ON "policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "renewals_policy_idx" ON "renewals" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "renewals_date_idx" ON "renewals" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "renewals_agency_date_idx" ON "renewals" USING btree ("agency_id","renewal_date");--> statement-breakpoint
CREATE INDEX "agency_id_idx" ON "users" USING btree ("agency_id");