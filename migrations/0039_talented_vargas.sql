-- IF NOT EXISTS : le journal Drizzle et l'etat reel de la base ont deja diverge
-- plusieurs fois sur ce projet (colonnes posees a la main en rattrapage).
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "commission_amount" numeric(10, 2);
