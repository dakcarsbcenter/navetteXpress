ALTER TABLE "invoices" ALTER COLUMN "tax_rate" SET DEFAULT '18.00';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "quote_reference" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "document_object" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "customer_address" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "customer_ninea" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "items" jsonb;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "reference" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "issued_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "valid_until" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "document_object" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "customer_address" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "customer_ninea" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_reference_unique" UNIQUE("reference");