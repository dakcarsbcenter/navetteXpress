-- Re-applique en tant que migration trackée le correctif ad-hoc de
-- migrations/add-default-updated-at.sql (2024-11-12), qui n'avait jamais été
-- rejoué que sur l'ancienne base Neon. La base Postgres du VPS (docker-compose,
-- initialisée uniquement via les migrations numérotées) ne l'a jamais reçu :
-- la colonne "updated_at" y est NOT NULL sans DEFAULT, ce qui fait échouer
-- tout insert qui ne fournit pas updated_at explicitement (ex: création d'un
-- chauffeur depuis /admin -> "null value in column updated_at").
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "custom_roles" ALTER COLUMN "updated_at" SET DEFAULT now();
