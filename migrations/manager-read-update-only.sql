-- Migration: Manager avec permissions READ et UPDATE uniquement
-- Date: 2025-10-17
-- Description: Le Manager peut consulter et modifier, mais pas créer ni supprimer

-- ============================================
-- NOUVELLE POLITIQUE MANAGER
-- ============================================
-- Le Manager a uniquement READ et UPDATE sur toutes les ressources
-- Pas de CREATE, pas de DELETE

-- ============================================
-- 👥 USERS: Read et Update uniquement
-- ============================================
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'users' AND action = 'create';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'users' AND action = 'read';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'users' AND action = 'update';
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'users' AND action = 'delete';

-- ============================================
-- 🚗 VEHICLES: Read et Update uniquement
-- ============================================
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'create';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'read';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'update';
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'delete';

-- ============================================
-- 📅 BOOKINGS: Read et Update uniquement
-- ============================================
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'create';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'read';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'update';
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'delete';

-- ============================================
-- 📋 QUOTES: Read et Update uniquement
-- ============================================
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'create';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'read';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'update';
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'delete';

-- ============================================
-- ⭐ REVIEWS: Read et Update uniquement
-- ============================================
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'create';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'read';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'update';
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'delete';

-- ============================================
-- VÉRIFICATION
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
  CASE action
    WHEN 'create' THEN 1
    WHEN 'read' THEN 2
    WHEN 'update' THEN 3
    WHEN 'delete' THEN 4
  END;
