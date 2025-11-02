-- Migration: Ajout des colonnes reset_token et reset_token_expiry pour la réinitialisation de mot de passe
-- Date: 2025-11-02

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Créer un index pour améliorer les performances de recherche par token
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Commentaires
COMMENT ON COLUMN users.reset_token IS 'Token de réinitialisation de mot de passe (32 caractères hex)';
COMMENT ON COLUMN users.reset_token_expiry IS 'Date d''expiration du token de réinitialisation (1 heure)';
