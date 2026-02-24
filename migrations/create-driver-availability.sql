-- Migration: Création de la table des disponibilités des chauffeurs
-- Date: 2024-11-12
-- Description: Permet aux chauffeurs de définir leurs disponibilités

-- Créer la table driver_availability
CREATE TABLE IF NOT EXISTS driver_availability (
  id SERIAL PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  specific_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_id ON driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_day_of_week ON driver_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_driver_availability_specific_date ON driver_availability(specific_date);

-- Commentaires sur les colonnes
COMMENT ON TABLE driver_availability IS 'Disponibilités et indisponibilités des chauffeurs';
COMMENT ON COLUMN driver_availability.day_of_week IS 'Jour de la semaine (0=Dimanche, 1=Lundi, ..., 6=Samedi)';
COMMENT ON COLUMN driver_availability.start_time IS 'Heure de début (format HH:mm)';
COMMENT ON COLUMN driver_availability.end_time IS 'Heure de fin (format HH:mm)';
COMMENT ON COLUMN driver_availability.is_available IS 'true=disponible, false=indisponible';
COMMENT ON COLUMN driver_availability.specific_date IS 'Date spécifique pour une disponibilité/indisponibilité particulière (optionnel)';

-- Insérer des disponibilités par défaut pour les chauffeurs existants (Lundi-Vendredi, 8h-18h)
INSERT INTO driver_availability (driver_id, day_of_week, start_time, end_time, is_available)
SELECT 
  id as driver_id,
  day_num as day_of_week,
  '08:00' as start_time,
  '18:00' as end_time,
  true as is_available
FROM 
  users,
  generate_series(1, 5) as day_num
WHERE 
  users.role = 'driver'
  AND users.is_active = true
ON CONFLICT DO NOTHING;

-- Vérification
SELECT 
  u.name,
  da.day_of_week,
  da.start_time,
  da.end_time,
  da.is_available
FROM driver_availability da
JOIN users u ON da.driver_id = u.id
ORDER BY u.name, da.day_of_week;
