CREATE TABLE "quote_trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"position" integer NOT NULL,
	"service" text NOT NULL,
	"departure" text NOT NULL,
	"destination" text NOT NULL,
	"scheduled_date_time" timestamp,
	"passengers" integer DEFAULT 1 NOT NULL,
	"luggage" integer DEFAULT 0 NOT NULL,
	"note" text,
	"estimated_price" numeric(10, 2),
	"booking_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_trips_passengers_check" CHECK ("quote_trips"."passengers" > 0),
	CONSTRAINT "quote_trips_luggage_check" CHECK ("quote_trips"."luggage" >= 0)
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "passenger_name" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "passenger_phone" text;--> statement-breakpoint
ALTER TABLE "quote_trips" ADD CONSTRAINT "quote_trips_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_trips" ADD CONSTRAINT "quote_trips_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quote_trips_quote_position_idx" ON "quote_trips" USING btree ("quote_id","position");