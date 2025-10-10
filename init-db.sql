-- Fichier d'initialisation de la base de données
-- Ce fichier sera exécuté automatiquement lors du premier démarrage du conteneur PostgreSQL

-- Créer la base de données si elle n'existe pas
SELECT 'CREATE DATABASE navettexpress'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'navettexpress')\gexec

-- Se connecter à la base de données
\c navettexpress;

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Les tables seront créées par les migrations Drizzle
-- Ce fichier sert principalement à s'assurer que la base de données existe