-- IF NOT EXISTS : le journal Drizzle et l'etat reel de la base ont deja diverge
-- plusieurs fois sur ce projet (colonnes posees a la main en rattrapage). Sans
-- ce garde-fou, le demarrage du conteneur echoue au lieu de passer la migration.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "review_request_sent_at" timestamp;--> statement-breakpoint
-- Courses deja terminees avant cette migration : completed_at est approxime par
-- updated_at (la seule date disponible), ET la demande d'avis est marquee comme
-- deja envoyee. Sans ce second champ, le premier passage du cron enverrait d'un
-- coup une demande d'avis a tout l'historique des courses terminees.
UPDATE "bookings"
SET "completed_at" = COALESCE("completed_at", "updated_at"),
    "review_request_sent_at" = COALESCE("review_request_sent_at", "updated_at")
WHERE "status" = 'completed';
