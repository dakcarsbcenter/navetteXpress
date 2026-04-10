-- Migration : Ajout des champs pour l'approbation du prix par le client
-- Date : 2025-11-18

-- Ajouter les colonnes pour gérer l'acceptation/rejet du prix
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS price_proposed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS client_response TEXT,
ADD COLUMN IF NOT EXISTS client_response_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS client_response_message TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN bookings.price_proposed_at IS 'Date à laquelle l''admin a proposé le prix au client';
COMMENT ON COLUMN bookings.client_response IS 'Réponse du client : pending, accepted, rejected';
COMMENT ON COLUMN bookings.client_response_at IS 'Date de la réponse du client';
COMMENT ON COLUMN bookings.client_response_message IS 'Message optionnel du client lors de sa réponse';
