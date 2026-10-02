-- Journal interne des corrections de facture. Idempotent : le journal de
-- migrations de ce projet a deja derive (colonne presente, migration non
-- enregistree), et ce fichier est aussi rejoue en prod par db:migrate:runtime.
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "internal_notes" text;
