CREATE TYPE "public"."company_request_status" AS ENUM('none', 'pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_status" "company_request_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_rejection_reason" text;