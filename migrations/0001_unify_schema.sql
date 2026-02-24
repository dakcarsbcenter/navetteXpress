-- Align enums
DO $$ BEGIN
  ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'manager';
  ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'driver';
  ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'customer';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migrate legacy role 'chauffeur' to 'driver'
UPDATE "users" SET "role" = 'driver' WHERE "role" = 'chauffeur';

-- Users: default role to 'customer'
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer';

-- Ensure license_number uniqueness already exists; add check: drivers must have license
DO $$ BEGIN
  ALTER TABLE "users"
  ADD CONSTRAINT driver_license_check CHECK ((role != 'driver') OR (license_number IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vehicles: driver_id optional and ON DELETE SET NULL
ALTER TABLE "vehicles" ALTER COLUMN "driver_id" DROP NOT NULL;
ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "vehicles_driver_id_users_id_fk";
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Bookings: relax foreign keys to SET NULL and allow nulls
ALTER TABLE "bookings" ALTER COLUMN "driver_id" DROP NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "vehicle_id" DROP NOT NULL;
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_driver_id_users_id_fk";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_vehicle_id_vehicles_id_fk";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL;

-- Vehicles photo check: expand to allow base64 data URIs
DO $$ BEGIN
  ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS vehicle_photo_image_check;
  ALTER TABLE "vehicles" ADD CONSTRAINT vehicle_photo_image_check CHECK (
    photo IS NULL OR 
    photo ~ '^https?://.*\\.(jpg|jpeg|png|gif|webp|bmp|svg)$' OR
    photo ~ '^data:image/(jpeg|jpg|png|gif|webp|bmp|svg\\+xml);base64,'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keep existing checks for year/capacity; ensure they exist
DO $$ BEGIN
  ALTER TABLE "vehicles" ADD CONSTRAINT year_check CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 2);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "vehicles" ADD CONSTRAINT capacity_check CHECK (capacity > 0 AND capacity <= 50);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure bookings future date check exists
DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT future_date_check CHECK (scheduled_date_time > NOW());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


