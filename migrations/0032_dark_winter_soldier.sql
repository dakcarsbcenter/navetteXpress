ALTER TABLE "bookings" ADD COLUMN "booking_group_id" text;--> statement-breakpoint
CREATE INDEX "bookings_booking_group_idx" ON "bookings" USING btree ("booking_group_id");