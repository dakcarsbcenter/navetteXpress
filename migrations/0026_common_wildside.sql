CREATE TYPE "public"."driver_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "driver_license_check";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "driver_status" "driver_request_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "driver_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "driver_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "driver_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "driver_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vehicle_brand" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vehicle_model" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vehicle_plate_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "driver_license_check" CHECK (("users"."role" != 'driver') OR ("users"."driver_status" = 'pending') OR ("users"."license_number" IS NOT NULL));