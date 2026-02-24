-- Migration manuelle pour ajouter les nouvelles colonnes
-- Étape 1: Ajouter la colonne role à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'chauffeur';

-- Étape 2: Ajouter la colonne phone à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;

-- Étape 3: Ajouter la colonne license_number à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number text;

-- Étape 4: Ajouter la colonne is_active à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Étape 5: Créer l'enum user_role
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'chauffeur');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Étape 6: Modifier la colonne role pour utiliser l'enum
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Étape 7: Créer l'enum booking_status
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Étape 8: Créer l'enum vehicle_type
DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'van', 'luxury', 'bus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Étape 9: Ajouter les colonnes aux véhicules
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type vehicle_type DEFAULT 'sedan';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_id text;

-- Étape 10: Ajouter les colonnes aux réservations
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status booking_status DEFAULT 'pending';

-- Étape 11: Créer la table permissions
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    allowed boolean NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Étape 12: Créer la table reviews
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    customer_id text NOT NULL,
    driver_id text NOT NULL,
    rating INTEGER NOT NULL,
    comment text,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5)
);

-- Étape 13: Ajouter les contraintes de clés étrangères
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_driver 
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_driver 
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_booking 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_customer 
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_driver 
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;
