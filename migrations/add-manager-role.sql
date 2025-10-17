-- Migration: Ajouter le rôle 'manager' à l'enum user_role
-- Date: 2025-10-16

-- Ajouter 'manager' à l'enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

-- Afficher les valeurs de l'enum pour confirmation
DO $$
BEGIN
  RAISE NOTICE 'Valeurs de l''enum user_role: %', 
    (SELECT array_agg(e.enumlabel) FROM pg_enum e 
     JOIN pg_type t ON e.enumtypid = t.oid 
     WHERE t.typname = 'user_role');
END $$;
