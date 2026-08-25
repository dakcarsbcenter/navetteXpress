-- Comble une dérive de schéma : ces 3 colonnes existaient dans src/schema.ts (et dans les
-- snapshots Drizzle depuis 0010) mais n'avaient jamais été créées par une migration SQL versionnée.
-- Idempotent pour ne pas casser les bases où elles ont déjà été ajoutées manuellement.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_failed_login" timestamp;
