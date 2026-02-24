-- Migration: Ajout des colonnes passengers, luggage et duration à la table bookings
-- Date: 2025-11-10
-- Description: Ajoute les colonnes pour stocker les informations de passagers, valises et durée directement dans la table bookings au lieu du champ notes

-- Ajouter la colonne passengers (nombre de passagers)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS passengers INTEGER NOT NULL DEFAULT 1;

-- Ajouter la contrainte pour passengers > 0
ALTER TABLE bookings 
ADD CONSTRAINT passengers_check CHECK (passengers > 0);

-- Ajouter la colonne luggage (nombre de valises)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS luggage INTEGER NOT NULL DEFAULT 1;

-- Ajouter la contrainte pour luggage >= 0
ALTER TABLE bookings 
ADD CONSTRAINT luggage_check CHECK (luggage >= 0);

-- Ajouter la colonne duration (durée estimée en heures)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS duration NUMERIC(4, 2) DEFAULT 2;

-- Commentaires pour documentation
COMMENT ON COLUMN bookings.passengers IS 'Nombre de passagers pour la réservation';
COMMENT ON COLUMN bookings.luggage IS 'Nombre de valises/bagages pour la réservation';
COMMENT ON COLUMN bookings.duration IS 'Durée estimée du trajet en heures';

-- Migration des données depuis le champ notes (optionnel, si des données existent)
-- Cette section extrait les valeurs depuis le champ notes et les insère dans les nouvelles colonnes
DO $$
DECLARE
    booking_record RECORD;
    passengers_value INTEGER;
    luggage_value INTEGER;
    duration_value NUMERIC(4, 2);
BEGIN
    FOR booking_record IN SELECT id, notes FROM bookings WHERE notes IS NOT NULL
    LOOP
        -- Extraire le nombre de passagers
        passengers_value := (regexp_match(booking_record.notes, 'Passagers:\s*(\d+)'))[1]::INTEGER;
        
        -- Extraire le nombre de valises
        luggage_value := (regexp_match(booking_record.notes, 'Valises:\s*(\d+)'))[1]::INTEGER;
        
        -- Extraire la durée
        duration_value := (regexp_match(booking_record.notes, 'Durée:\s*(\d+\.?\d*)h'))[1]::NUMERIC(4, 2);
        
        -- Mettre à jour la réservation si des valeurs ont été trouvées
        IF passengers_value IS NOT NULL OR luggage_value IS NOT NULL OR duration_value IS NOT NULL THEN
            UPDATE bookings 
            SET 
                passengers = COALESCE(passengers_value, passengers),
                luggage = COALESCE(luggage_value, luggage),
                duration = COALESCE(duration_value, duration)
            WHERE id = booking_record.id;
            
            RAISE NOTICE 'Migration réservation #%: passagers=%, valises=%, durée=%', 
                booking_record.id, 
                COALESCE(passengers_value, 'inchangé'), 
                COALESCE(luggage_value, 'inchangé'),
                COALESCE(duration_value, 'inchangé');
        END IF;
    END LOOP;
END $$;

-- Afficher un résumé
SELECT 
    COUNT(*) as total_bookings,
    AVG(passengers) as avg_passengers,
    AVG(luggage) as avg_luggage,
    AVG(duration) as avg_duration
FROM bookings;

RAISE NOTICE '✅ Migration terminée: colonnes passengers, luggage et duration ajoutées à la table bookings';
