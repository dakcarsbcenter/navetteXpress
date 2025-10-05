-- Migration manuelle pour convertir les rôles 'chauffeur' vers 'driver'

-- 1. Convertir toutes les valeurs 'chauffeur' en 'driver' dans la table users
UPDATE users SET role = 'driver' WHERE role = 'chauffeur';

-- 2. Convertir toutes les valeurs 'chauffeur' en 'driver' dans la table permissions
UPDATE permissions SET role = 'driver' WHERE role = 'chauffeur';

-- 3. Supprimer la contrainte future_date_check si elle existe encore
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'future_date_check' AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT future_date_check;
    END IF;
END $$;

-- 4. Mettre à jour l'enum user_role
-- Temporairement, convertir en text
ALTER TABLE users ALTER COLUMN role SET DATA TYPE text;
ALTER TABLE permissions ALTER COLUMN role SET DATA TYPE text;

-- Supprimer et recréer l'enum
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM('admin', 'driver', 'customer');

-- Reconvertir vers l'enum
ALTER TABLE users ALTER COLUMN role SET DATA TYPE user_role USING role::user_role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'::user_role;
ALTER TABLE permissions ALTER COLUMN role SET DATA TYPE user_role USING role::user_role;
