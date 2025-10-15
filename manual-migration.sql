-- Script SQL direct pour créer les tables custom_roles
-- Exécution manuelle via Drizzle

-- Étape 1: Créer la table custom_roles
CREATE TABLE IF NOT EXISTS custom_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  level INTEGER DEFAULT 1,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Étape 2: Créer la table role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_name, resource, action)
);

-- Étape 3: Insérer les rôles système
INSERT INTO custom_roles (name, display_name, description, color, level, is_system) VALUES
('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#dc2626', 5, true),
('driver', 'Chauffeur', 'Accès aux réservations et véhicules assignés', '#059669', 2, true),
('customer', 'Client', 'Accès aux réservations et demandes de devis', '#2563eb', 1, true)
ON CONFLICT (name) DO NOTHING;

-- Étape 4: Migrer les permissions existantes
INSERT INTO role_permissions (role_name, resource, action, allowed)
SELECT role::text, resource, action, allowed 
FROM permissions
ON CONFLICT (role_name, resource, action) DO NOTHING;