-- Correctif : 500 sur /api/client/bookings (colonne "trip_plan_id" manquante)
-- Date : 2026-08-28
-- Contexte : la migration 0016_colossal_next_avengers.sql (table trip_plans +
-- colonne bookings.trip_plan_id) est bien suivie dans migrations/meta/_journal.json,
-- mais ne semble jamais avoir été réellement appliquée en prod par le migrateur
-- automatique du conteneur (start.sh -> scripts/run-migrations.mjs), le même
-- symptôme déjà documenté au chapitre 9 du guide de déploiement ("migrations
-- applied successfully" sans changement réel constaté en base).
--
-- Ce script rejoue à la main, de façon idempotente, le contenu de cette migration.
-- Il peut être exécuté plusieurs fois sans risque.

BEGIN;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_plan_recurrence') THEN
        CREATE TYPE "public"."trip_plan_recurrence" AS ENUM('once', 'weekly', 'monthly', 'custom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_plan_status') THEN
        CREATE TYPE "public"."trip_plan_status" AS ENUM('active', 'completed', 'cancelled');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "trip_plans" (
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

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "trip_plan_id" integer;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trip_plans_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "trip_plans" ADD CONSTRAINT "trip_plans_user_id_users_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bookings_trip_plan_id_trip_plans_id_fk'
    ) THEN
        ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_plan_id_trip_plans_id_fk"
          FOREIGN KEY ("trip_plan_id") REFERENCES "public"."trip_plans"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;

COMMIT;

-- Vérification
\d bookings
\d trip_plans
