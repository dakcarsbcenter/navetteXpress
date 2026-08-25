CREATE TYPE "public"."trip_plan_recurrence" AS ENUM('once', 'weekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."trip_plan_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "trip_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pickup_address" text NOT NULL,
	"dropoff_address" text NOT NULL,
	"time" text NOT NULL,
	"passengers" integer DEFAULT 1 NOT NULL,
	"luggage" integer DEFAULT 0 NOT NULL,
	"recurrence" "trip_plan_recurrence" NOT NULL,
	"days_of_week" jsonb,
	"day_of_month" integer,
	"custom_dates" jsonb,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"notes" text,
	"status" "trip_plan_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trip_plan_passengers_check" CHECK ("trip_plans"."passengers" > 0)
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "trip_plan_id" integer;--> statement-breakpoint
ALTER TABLE "trip_plans" ADD CONSTRAINT "trip_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_plan_id_trip_plans_id_fk" FOREIGN KEY ("trip_plan_id") REFERENCES "public"."trip_plans"("id") ON DELETE set null ON UPDATE no action;