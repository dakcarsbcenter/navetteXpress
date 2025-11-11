CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'pending', 'paid', 'cancelled', 'overdue');--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"quote_id" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"service" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "amount_check" CHECK ("invoices"."amount" > 0),
	CONSTRAINT "total_check" CHECK ("invoices"."total_amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicle_photo_image_check";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "passengers" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "luggage" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "duration" numeric(4, 2) DEFAULT '2';--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "passengers_check" CHECK ("bookings"."passengers" > 0);--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "luggage_check" CHECK ("bookings"."luggage" >= 0);