ALTER TABLE "users" ADD COLUMN "vehicle_year" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vehicle_outside_criteria" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "corridor_a" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "corridor_b" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "corridor_c" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "declared_availability" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "utm_campaign" text;