CREATE TYPE "public"."quote_status" AS ENUM('pending', 'in_progress', 'sent', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"service" text NOT NULL,
	"preferred_date" timestamp,
	"message" text NOT NULL,
	"status" "quote_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"estimated_price" numeric(10, 2),
	"assigned_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;