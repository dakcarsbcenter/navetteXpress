-- Migration simplifiée : Ajout des colonnes reset_token et reset_token_expiry
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" timestamp;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_users_reset_token" ON "users"("reset_token");
