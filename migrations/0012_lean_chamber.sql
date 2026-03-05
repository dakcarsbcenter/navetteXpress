CREATE TYPE "public"."report_category" AS ENUM('mechanical', 'electrical', 'bodywork', 'interior', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_severity" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "vehicle_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_table_id" integer,
	"driver_id" text NOT NULL,
	"category" "report_category" DEFAULT 'mechanical' NOT NULL,
	"severity" "report_severity" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "features" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_company" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ninea" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "raison_sociale" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bp" text;--> statement-breakpoint
ALTER TABLE "vehicle_reports" ADD CONSTRAINT "vehicle_reports_vehicle_table_id_vehicles_id_fk" FOREIGN KEY ("vehicle_table_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_reports" ADD CONSTRAINT "vehicle_reports_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;