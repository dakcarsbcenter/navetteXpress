-- Migration: Correction des permissions de suppression pour le rôle Manager
-- Date: 2025-10-17
-- Description: Retirer la permission de supprimer les utilisateurs au rôle Manager
--              Conformément à la matrice des permissions PERMISSIONS_MATRIX_SUMMARY.md

-- ============================================
-- CORRECTION: Manager - Users Permissions
-- ============================================
-- Le Manager ne doit PAS pouvoir supprimer les utilisateurs
-- Il peut seulement LIRE les utilisateurs

-- Retirer toutes les permissions manager sur users sauf READ
UPDATE role_permissions 
SET allowed = false 
WHERE role_name = 'manager' 
  AND resource = 'users' 
  AND action IN ('create', 'update', 'delete');

-- S'assurer que READ est activé pour manager sur users
UPDATE role_permissions 
SET allowed = true 
WHERE role_name = 'manager' 
  AND resource = 'users' 
  AND action = 'read';

-- Si la ligne n'existe pas, la créer
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('manager', 'users', 'read', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- VÉRIFICATION: Afficher les permissions Manager
-- ============================================
SELECT 
  resource,
  action,
  allowed
FROM role_permissions
WHERE role_name = 'manager'
ORDER BY 
  CASE resource
    WHEN 'users' THEN 1
    WHEN 'vehicles' THEN 2
    WHEN 'bookings' THEN 3
    WHEN 'quotes' THEN 4
    WHEN 'reviews' THEN 5
  END,
  action;

-- ============================================
-- MATRICE ATTENDUE POUR MANAGER
-- ============================================
-- 👥 Users:        Lire uniquement
-- 🚗 Vehicles:     Gérer (create, read, update, delete)
-- 📅 Bookings:     Gérer (create, read, update, delete)
-- 📋 Quotes:       Gérer (create, read, update, delete)
-- ⭐ Reviews:      Gérer (create, read, update, delete)
