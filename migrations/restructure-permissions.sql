-- Migration: Restructuration des permissions en permissions composées
-- Date: 2025-10-16
-- Description: Transformer les permissions atomiques en permissions composées pour la matrice

-- Étape 1: Supprimer toutes les permissions existantes (backup recommandé)
TRUNCATE TABLE role_permissions;

-- Étape 2: Créer les permissions composées pour chaque ressource

-- ============================================
-- USERS PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur users
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('admin', 'users', 'create', true, 'Créer des utilisateurs'),
('admin', 'users', 'read', true, 'Voir les utilisateurs'),
('admin', 'users', 'update', true, 'Modifier les utilisateurs'),
('admin', 'users', 'delete', true, 'Supprimer les utilisateurs');

-- Manager: manage users (toutes les actions)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('manager', 'users', 'create', true, 'Créer des utilisateurs'),
('manager', 'users', 'read', true, 'Voir les utilisateurs'),
('manager', 'users', 'update', true, 'Modifier les utilisateurs'),
('manager', 'users', 'delete', true, 'Supprimer les utilisateurs');

-- Customer: aucune permission sur users (toutes à false)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('customer', 'users', 'create', false, 'Créer des utilisateurs'),
('customer', 'users', 'read', false, 'Voir les utilisateurs'),
('customer', 'users', 'update', false, 'Modifier les utilisateurs'),
('customer', 'users', 'delete', false, 'Supprimer les utilisateurs');

-- ============================================
-- VEHICLES PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur vehicles
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('admin', 'vehicles', 'create', true, 'Créer des véhicules'),
('admin', 'vehicles', 'read', true, 'Voir les véhicules'),
('admin', 'vehicles', 'update', true, 'Modifier les véhicules'),
('admin', 'vehicles', 'delete', true, 'Supprimer les véhicules');

-- Manager: manage vehicles (toutes les actions)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('manager', 'vehicles', 'create', true, 'Créer des véhicules'),
('manager', 'vehicles', 'read', true, 'Voir les véhicules'),
('manager', 'vehicles', 'update', true, 'Modifier les véhicules'),
('manager', 'vehicles', 'delete', true, 'Supprimer les véhicules');

-- Customer: aucune permission sur vehicles
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('customer', 'vehicles', 'create', false, 'Créer des véhicules'),
('customer', 'vehicles', 'read', false, 'Voir les véhicules'),
('customer', 'vehicles', 'update', false, 'Modifier les véhicules'),
('customer', 'vehicles', 'delete', false, 'Supprimer les véhicules');

-- ============================================
-- BOOKINGS PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur bookings
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('admin', 'bookings', 'create', true, 'Créer des réservations'),
('admin', 'bookings', 'read', true, 'Voir les réservations'),
('admin', 'bookings', 'update', true, 'Modifier les réservations'),
('admin', 'bookings', 'delete', true, 'Supprimer les réservations');

-- Manager: manage bookings (toutes les actions)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('manager', 'bookings', 'create', true, 'Créer des réservations'),
('manager', 'bookings', 'read', true, 'Voir les réservations'),
('manager', 'bookings', 'update', true, 'Modifier les réservations'),
('manager', 'bookings', 'delete', true, 'Supprimer les réservations');

-- Customer: read bookings uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('customer', 'bookings', 'create', false, 'Créer des réservations'),
('customer', 'bookings', 'read', true, 'Voir ses propres réservations'),
('customer', 'bookings', 'update', false, 'Modifier des réservations'),
('customer', 'bookings', 'delete', false, 'Supprimer des réservations');

-- ============================================
-- QUOTES PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur quotes
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('admin', 'quotes', 'create', true, 'Créer des devis'),
('admin', 'quotes', 'read', true, 'Voir les devis'),
('admin', 'quotes', 'update', true, 'Modifier les devis'),
('admin', 'quotes', 'delete', true, 'Supprimer les devis');

-- Manager: manage quotes (toutes les actions)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('manager', 'quotes', 'create', true, 'Créer des devis'),
('manager', 'quotes', 'read', true, 'Voir les devis'),
('manager', 'quotes', 'update', true, 'Modifier les devis'),
('manager', 'quotes', 'delete', true, 'Supprimer les devis');

-- Customer: read quotes uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('customer', 'quotes', 'create', false, 'Créer des devis'),
('customer', 'quotes', 'read', true, 'Voir ses propres devis'),
('customer', 'quotes', 'update', false, 'Modifier des devis'),
('customer', 'quotes', 'delete', false, 'Supprimer des devis');

-- ============================================
-- REVIEWS PERMISSIONS
-- ============================================

-- Admin: Toutes les permissions sur reviews
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('admin', 'reviews', 'create', true, 'Créer des avis'),
('admin', 'reviews', 'read', true, 'Voir les avis'),
('admin', 'reviews', 'update', true, 'Modifier les avis'),
('admin', 'reviews', 'delete', true, 'Supprimer les avis');

-- Manager: manage reviews (toutes les actions)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('manager', 'reviews', 'create', true, 'Créer des avis'),
('manager', 'reviews', 'read', true, 'Voir les avis'),
('manager', 'reviews', 'update', true, 'Modifier les avis'),
('manager', 'reviews', 'delete', true, 'Supprimer les avis');

-- Customer: read reviews uniquement
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('customer', 'reviews', 'create', false, 'Créer des avis'),
('customer', 'reviews', 'read', true, 'Voir ses propres avis'),
('customer', 'reviews', 'update', false, 'Modifier des avis'),
('customer', 'reviews', 'delete', false, 'Supprimer des avis');

-- ============================================
-- DRIVER PERMISSIONS
-- ============================================

-- Driver: users (aucune permission)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('driver', 'users', 'create', false, 'Créer des utilisateurs'),
('driver', 'users', 'read', false, 'Voir les utilisateurs'),
('driver', 'users', 'update', false, 'Modifier les utilisateurs'),
('driver', 'users', 'delete', false, 'Supprimer les utilisateurs');

-- Driver: vehicles (read uniquement)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('driver', 'vehicles', 'create', false, 'Créer des véhicules'),
('driver', 'vehicles', 'read', true, 'Voir les véhicules'),
('driver', 'vehicles', 'update', false, 'Modifier les véhicules'),
('driver', 'vehicles', 'delete', false, 'Supprimer les véhicules');

-- Driver: bookings (read et update)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('driver', 'bookings', 'create', false, 'Créer des réservations'),
('driver', 'bookings', 'read', true, 'Voir les réservations assignées'),
('driver', 'bookings', 'update', true, 'Mettre à jour le statut'),
('driver', 'bookings', 'delete', false, 'Supprimer des réservations');

-- Driver: quotes (aucune permission)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('driver', 'quotes', 'create', false, 'Créer des devis'),
('driver', 'quotes', 'read', false, 'Voir les devis'),
('driver', 'quotes', 'update', false, 'Modifier les devis'),
('driver', 'quotes', 'delete', false, 'Supprimer les devis');

-- Driver: reviews (read uniquement)
INSERT INTO role_permissions (role_name, resource, action, allowed, description) VALUES
('driver', 'reviews', 'create', false, 'Créer des avis'),
('driver', 'reviews', 'read', true, 'Voir les avis'),
('driver', 'reviews', 'update', false, 'Modifier les avis'),
('driver', 'reviews', 'delete', false, 'Supprimer les avis');

-- ============================================
-- Vérification
-- ============================================

-- Afficher toutes les permissions par rôle
SELECT 
  role_name,
  resource,
  COUNT(*) as actions_count,
  array_agg(action ORDER BY action) as actions
FROM role_permissions
WHERE allowed = true
GROUP BY role_name, resource
ORDER BY role_name, resource;
