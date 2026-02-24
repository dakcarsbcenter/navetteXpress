-- Migration: Ajout de DEFAULT NOW() aux colonnes updated_at
-- Date: 2024-11-12
-- Raison: Correction de l'erreur lors de la création de devis

-- Table users
ALTER TABLE users 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Table vehicles
ALTER TABLE vehicles 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Table bookings
ALTER TABLE bookings 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Table quotes
ALTER TABLE quotes 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Table invoices
ALTER TABLE invoices 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Table custom_roles
ALTER TABLE custom_roles 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Vérification
SELECT 
  table_name,
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE 
  column_name = 'updated_at'
  AND table_schema = 'public'
  AND table_name IN ('users', 'vehicles', 'bookings', 'quotes', 'invoices', 'custom_roles')
ORDER BY table_name;
