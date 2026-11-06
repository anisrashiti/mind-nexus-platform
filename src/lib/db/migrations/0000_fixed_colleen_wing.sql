CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE TYPE "public"."access_status" AS ENUM('invited', 'active', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('confirmed', 'cancelled', 'late_cancelled', 'cancelled_by_psychologist', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."ledger_reason" AS ENUM('booking', 'refund', 'extra');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'sq');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."outcome" AS ENUM('none', 'pending', 'given_back', 'kept');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('employee', 'psychologist', 'hr');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'confirmed' NOT NULL,
	"outcome" "outcome" DEFAULT 'none' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"employee_joined_at" timestamp with time zone,
	"psychologist_joined_at" timestamp with time zone,
	"whereby_meeting_id" text,
	"whereby_room_url_enc" text,
	"whereby_host_url_enc" text,
	"reminder_24h_sent_at" timestamp with time zone,
	"reminder_15m_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_fifty_minutes" CHECK ("appointments"."ends_at" = "appointments"."starts_at" + interval '50 minutes')
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "weekday_bounds" CHECK ("availability_rules"."weekday" between 1 and 7),
	CONSTRAINT "valid_availability_range" CHECK ("availability_rules"."start_time" < "availability_rules"."end_time"),
	CONSTRAINT "availability_grid" CHECK (extract(minute from "availability_rules"."start_time") in (0,30) and extract(second from "availability_rules"."start_time") = 0 and extract(minute from "availability_rules"."end_time") in (0,30) and extract(second from "availability_rules"."end_time") = 0)
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"version" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" "citext" NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hr_contact_name" text NOT NULL,
	"hr_contact_email" "citext" NOT NULL,
	"sessions_per_employee" integer DEFAULT 1 NOT NULL,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_per_employee_bounds" CHECK ("organizations"."sessions_per_employee" between 0 and 10)
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "password_resets_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "psychologist_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"languages" text[] NOT NULL,
	"bio" text NOT NULL,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"resets_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" smallint NOT NULL,
	"reason" "ledger_reason" NOT NULL,
	"appointment_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_amount" CHECK (("session_ledger"."reason" = 'booking' and "session_ledger"."amount" = -1 and "session_ledger"."appointment_id" is not null) or ("session_ledger"."reason" = 'refund' and "session_ledger"."amount" = 1 and "session_ledger"."appointment_id" is not null) or ("session_ledger"."reason" = 'extra' and "session_ledger"."amount" = 1 and "session_ledger"."appointment_id" is null))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "valid_time_off" CHECK ("time_off"."ends_at" > "time_off"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "urgent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"body_enc" text NOT NULL,
	"phone_enc" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"handled_at" timestamp with time zone,
	"handled_by" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"email" "citext" NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text,
	"role" "role" NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"status" "access_status" DEFAULT 'invited' NOT NULL,
	"invited_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "role_organization" CHECK (("users"."role" = 'psychologist' and "users"."organization_id" is null) or ("users"."role" <> 'psychologist' and "users"."organization_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_psychologist_id_users_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointment_employee_organization_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."users"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_psychologist_id_users_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_profiles" ADD CONSTRAINT "psychologist_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_ledger" ADD CONSTRAINT "session_ledger_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_ledger" ADD CONSTRAINT "session_ledger_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_ledger" ADD CONSTRAINT "session_ledger_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_psychologist_id_users_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urgent_messages" ADD CONSTRAINT "urgent_messages_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urgent_messages" ADD CONSTRAINT "urgent_messages_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_confirmed_per_employee" ON "appointments" USING btree ("employee_id") WHERE "appointments"."status" = 'confirmed';--> statement-breakpoint
CREATE UNIQUE INDEX "one_consent_version" ON "consents" USING btree ("user_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_ledger_reason_once" ON "session_ledger" USING btree ("appointment_id","reason") WHERE "session_ledger"."appointment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_organization_key" ON "users" USING btree ("id","organization_id");

--> statement-breakpoint
ALTER TABLE appointments ADD CONSTRAINT no_psychologist_overlap EXCLUDE USING gist (psychologist_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status IN ('confirmed','completed','no_show','late_cancelled'));
--> statement-breakpoint
CREATE FUNCTION reject_audit_change() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''audit_log is append-only''; END';
--> statement-breakpoint
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION reject_audit_change();
