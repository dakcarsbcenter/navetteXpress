-- Migration: Correction COMPLÈTE des permissions Manager
-- Date: 2025-10-17
-- Description: Appliquer exactement la matrice PERMISSIONS_MATRIX_SUMMARY.md
--
-- 👥 USERS:      read=✅  create=❌  update=❌  delete=❌
-- 🚗 VEHICLES:   read=✅  create=✅  update=✅  delete=✅ (Gérer)
-- 📅 BOOKINGS:   read=✅  create=✅  update=✅  delete=✅ (Gérer)
-- 📋 QUOTES:     read=✅  create=✅  update=✅  delete=✅ (Gérer)
-- ⭐ REVIEWS:    read=✅  create=✅  update=✅  delete=✅ (Gérer)

-- ============================================
-- 👥 USERS: Lecture seule pour Manager
-- ============================================
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'users' AND action = 'create';
UPDATE role_permissions SET allowed = true  WHERE role_name = 'manager' AND resource = 'users' AND action = 'read';
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'users' AND action = 'update';
UPDATE role_permissions SET allowed = false WHERE role_name = 'manager' AND resource = 'users' AND action = 'delete';

-- ============================================
-- 🚗 VEHICLES: Gérer (tous droits) pour Manager
-- ============================================
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'create';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'read';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'update';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'vehicles' AND action = 'delete';

-- ============================================
-- 📅 BOOKINGS: Gérer (tous droits) pour Manager
-- ============================================
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'create';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'read';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'update';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'bookings' AND action = 'delete';

-- ============================================
-- 📋 QUOTES: Gérer (tous droits) pour Manager
-- ============================================
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'create';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'read';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'update';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'quotes' AND action = 'delete';

-- ============================================
-- ⭐ REVIEWS: Gérer (tous droits) pour Manager
-- ============================================
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'create';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'read';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'update';
UPDATE role_permissions SET allowed = true WHERE role_name = 'manager' AND resource = 'reviews' AND action = 'delete';

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT 
  resource,
  action,
  allowed
FROM role_permissions
WHERE role_name = 'manager'
ORDER BY resource, action;
