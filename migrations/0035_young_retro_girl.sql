-- La table est deja creee par la migration 0034 (elle doit exister avant son INSERT).
-- Cette migration ne sert qu a enregistrer la table dans le schema drizzle, pour qu un
-- db:push ne la supprime pas : elle doit donc rester idempotente.
CREATE TABLE IF NOT EXISTS "driver_availability_orphans_backup" (
	"id" integer,
	"driver_id" text,
	"day_of_week" integer,
	"start_time" text,
	"end_time" text,
	"is_available" boolean,
	"specific_date" timestamp,
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"archived_at" timestamp DEFAULT now() NOT NULL
);
