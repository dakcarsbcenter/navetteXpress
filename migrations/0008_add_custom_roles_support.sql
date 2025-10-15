-- Migration pour ajouter le support des rôles personnalisés
-- Créer une nouvelle table pour les rôles dynamiques

CREATE TABLE IF NOT EXISTS custom_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Couleur hex pour l'affichage
  level INTEGER DEFAULT 1, -- Niveau d'autorisation (1 = bas, 5 = élevé)
  is_system BOOLEAN DEFAULT false, -- true pour admin/driver/customer, false pour les rôles personnalisés
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les rôles système existants
INSERT INTO custom_roles (name, display_name, description, color, level, is_system) VALUES
('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#dc2626', 5, true),
('driver', 'Chauffeur', 'Accès aux réservations et véhicules assignés', '#059669', 2, true),
('customer', 'Client', 'Accès aux réservations et demandes de devis', '#2563eb', 1, true)
ON CONFLICT (name) DO NOTHING;

-- Créer une table de liaison entre rôles et permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) REFERENCES custom_roles(name) ON DELETE CASCADE,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_name, resource, action)
);

-- Migrer les permissions existantes
INSERT INTO role_permissions (role_name, resource, action, allowed)
SELECT role::text, resource, action, allowed 
FROM permissions
ON CONFLICT (role_name, resource, action) DO NOTHING;