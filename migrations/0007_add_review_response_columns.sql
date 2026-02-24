ALTER TABLE "reviews" ADD COLUMN "response" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "responded_by" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "responded_at" timestamp;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "is_approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;