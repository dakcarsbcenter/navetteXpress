CREATE TYPE "public"."flight_status" AS ENUM('scheduled', 'active', 'landed', 'cancelled', 'incident', 'diverted', 'unknown');--> statement-breakpoint
CREATE TABLE "flight_api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"month_key" text NOT NULL,
	"call_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flight_api_usage_month_key_unique" UNIQUE("month_key")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "flight_number" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "airline" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "flight_status" "flight_status";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "flight_scheduled_time" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "flight_estimated_time" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "flight_last_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "flight_raw_data" jsonb;