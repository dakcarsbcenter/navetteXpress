-- Migration: Restructuration CORRECTE des permissions composées
-- Date: 2025-10-17
-- Description: Permissions conformes à PERMISSIONS_MATRIX_SUMMARY.md
--              Manager ne peut PAS supprimer les utilisateurs

-- Étape 1: Supprimer toutes les permissions existantes (backup recommandé)
TRUNCATE TABLE role_permissions;

-- ============================================
-- USERS PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur users (Gérer = create, read, update, delete)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'users', 'create', true, 'Créer des utilisateurs'),
('admin', 'users', 'read', true, 'Voir les utilisateurs'),
('admin', 'users', 'update', true, 'Modifier les utilisateurs'),
('admin', 'users', 'delete', true);

-- Manager: LIRE UNIQUEMENT les utilisateurs (pas de create, update, delete)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'users', 'create', false, 'Créer des utilisateurs'),
('manager', 'users', 'read', true, 'Voir les utilisateurs'),
('manager', 'users', 'update', false, 'Modifier les utilisateurs'),
('manager', 'users', 'delete', false);

-- Customer: aucune permission sur users
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'users', 'create', false, 'Créer des utilisateurs'),
('customer', 'users', 'read', false, 'Voir les utilisateurs'),
('customer', 'users', 'update', false, 'Modifier les utilisateurs'),
('customer', 'users', 'delete', false);

-- Driver: aucune permission sur users
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'users', 'create', false, 'Créer des utilisateurs'),
('driver', 'users', 'read', false, 'Voir les utilisateurs'),
('driver', 'users', 'update', false, 'Modifier les utilisateurs'),
('driver', 'users', 'delete', false);

-- ============================================
-- VEHICLES PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur vehicles (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'vehicles', 'create', true, 'Créer des véhicules'),
('admin', 'vehicles', 'read', true, 'Voir les véhicules'),
('admin', 'vehicles', 'update', true, 'Modifier les véhicules'),
('admin', 'vehicles', 'delete', true);

-- Manager: Toutes les permissions sur vehicles (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'vehicles', 'create', true, 'Créer des véhicules'),
('manager', 'vehicles', 'read', true, 'Voir les véhicules'),
('manager', 'vehicles', 'update', true, 'Modifier les véhicules'),
('manager', 'vehicles', 'delete', true);

-- Customer: aucune permission sur vehicles
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'vehicles', 'create', false, 'Créer des véhicules'),
('customer', 'vehicles', 'read', false, 'Voir les véhicules'),
('customer', 'vehicles', 'update', false, 'Modifier les véhicules'),
('customer', 'vehicles', 'delete', false);

-- Driver: read uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'vehicles', 'create', false, 'Créer des véhicules'),
('driver', 'vehicles', 'read', true, 'Voir les véhicules'),
('driver', 'vehicles', 'update', false, 'Modifier les véhicules'),
('driver', 'vehicles', 'delete', false);

-- ============================================
-- BOOKINGS PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur bookings (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'bookings', 'create', true, 'Créer des réservations'),
('admin', 'bookings', 'read', true, 'Voir les réservations'),
('admin', 'bookings', 'update', true, 'Modifier les réservations'),
('admin', 'bookings', 'delete', true);

-- Manager: Toutes les permissions sur bookings (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'bookings', 'create', true, 'Créer des réservations'),
('manager', 'bookings', 'read', true, 'Voir les réservations'),
('manager', 'bookings', 'update', true, 'Modifier les réservations'),
('manager', 'bookings', 'delete', true);

-- Customer: read uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'bookings', 'create', false, 'Créer des réservations'),
('customer', 'bookings', 'read', true, 'Voir ses propres réservations'),
('customer', 'bookings', 'update', false, 'Modifier des réservations'),
('customer', 'bookings', 'delete', false);

-- Driver: read et update
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'bookings', 'create', false, 'Créer des réservations'),
('driver', 'bookings', 'read', true, 'Voir les réservations assignées'),
('driver', 'bookings', 'update', true, 'Mettre à jour le statut'),
('driver', 'bookings', 'delete', false);

-- ============================================
-- QUOTES PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur quotes (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'quotes', 'create', true, 'Créer des devis'),
('admin', 'quotes', 'read', true, 'Voir les devis'),
('admin', 'quotes', 'update', true, 'Modifier les devis'),
('admin', 'quotes', 'delete', true);

-- Manager: Toutes les permissions sur quotes (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'quotes', 'create', true, 'Créer des devis'),
('manager', 'quotes', 'read', true, 'Voir les devis'),
('manager', 'quotes', 'update', true, 'Modifier les devis'),
('manager', 'quotes', 'delete', true);

-- Customer: read uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'quotes', 'create', false, 'Créer des devis'),
('customer', 'quotes', 'read', true, 'Voir ses propres devis'),
('customer', 'quotes', 'update', false, 'Modifier des devis'),
('customer', 'quotes', 'delete', false);

-- Driver: aucune permission
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'quotes', 'create', false, 'Créer des devis'),
('driver', 'quotes', 'read', false, 'Voir les devis'),
('driver', 'quotes', 'update', false, 'Modifier les devis'),
('driver', 'quotes', 'delete', false);

-- ============================================
-- REVIEWS PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur reviews (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'reviews', 'create', true, 'Créer des avis'),
('admin', 'reviews', 'read', true, 'Voir les avis'),
('admin', 'reviews', 'update', true, 'Modifier les avis'),
('admin', 'reviews', 'delete', true);

-- Manager: Toutes les permissions sur reviews (Gérer)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'reviews', 'create', true, 'Créer des avis'),
('manager', 'reviews', 'read', true, 'Voir les avis'),
('manager', 'reviews', 'update', true, 'Modifier les avis'),
('manager', 'reviews', 'delete', true);

-- Customer: read uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'reviews', 'create', false, 'Créer des avis'),
('customer', 'reviews', 'read', true, 'Voir ses propres avis'),
('customer', 'reviews', 'update', false, 'Modifier des avis'),
('customer', 'reviews', 'delete', false);

-- Driver: read uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'reviews', 'create', false, 'Créer des avis'),
('driver', 'reviews', 'read', true, 'Voir les avis'),
('driver', 'reviews', 'update', false, 'Modifier les avis'),
('driver', 'reviews', 'delete', false);

-- ============================================
-- VÉRIFICATION: Matrice complète
-- ============================================

SELECT 
  '👥 USERS' as resource_section,
  role_name,
  MAX(CASE WHEN action = 'create' AND allowed THEN '✅' ELSE '❌' END) as "➕ Create",
  MAX(CASE WHEN action = 'read' AND allowed THEN '✅' ELSE '❌' END) as "👁️ Read",
  MAX(CASE WHEN action = 'update' AND allowed THEN '✅' ELSE '❌' END) as "✏️ Update",
  MAX(CASE WHEN action = 'delete' AND allowed THEN '✅' ELSE '❌' END) as "🗑️ Delete"
FROM role_permissions
WHERE resource = 'users'
GROUP BY role_name
ORDER BY role_name

UNION ALL

SELECT 
  '🚗 VEHICLES' as resource_section,
  role_name,
  MAX(CASE WHEN action = 'create' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'read' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'update' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'delete' AND allowed THEN '✅' ELSE '❌' END)
FROM role_permissions
WHERE resource = 'vehicles'
GROUP BY role_name
ORDER BY role_name

UNION ALL

SELECT 
  '📅 BOOKINGS' as resource_section,
  role_name,
  MAX(CASE WHEN action = 'create' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'read' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'update' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'delete' AND allowed THEN '✅' ELSE '❌' END)
FROM role_permissions
WHERE resource = 'bookings'
GROUP BY role_name
ORDER BY role_name

UNION ALL

SELECT 
  '📋 QUOTES' as resource_section,
  role_name,
  MAX(CASE WHEN action = 'create' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'read' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'update' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'delete' AND allowed THEN '✅' ELSE '❌' END)
FROM role_permissions
WHERE resource = 'quotes'
GROUP BY role_name
ORDER BY role_name

UNION ALL

SELECT 
  '⭐ REVIEWS' as resource_section,
  role_name,
  MAX(CASE WHEN action = 'create' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'read' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'update' AND allowed THEN '✅' ELSE '❌' END),
  MAX(CASE WHEN action = 'delete' AND allowed THEN '✅' ELSE '❌' END)
FROM role_permissions
WHERE resource = 'reviews'
GROUP BY role_name
ORDER BY role_name;

