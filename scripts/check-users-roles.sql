-- Script SQL pour vérifier les utilisateurs et leurs rôles
-- Usage: psql -h localhost -U postgres -d navetteXpress -f scripts/check-users-roles.sql

SELECT 
  id,
  name,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN 'http://localhost:3000/admin/dashboard'
    WHEN role = 'driver' THEN 'http://localhost:3000/driver/dashboard'
    WHEN role = 'customer' THEN 'http://localhost:3000/client/dashboard'
    ELSE 'http://localhost:3000/client/dashboard'
  END as dashboard_url,
  created_at
FROM users 
ORDER BY role, created_at;

-- Statistiques par rôle
SELECT 
  role,
  COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY role;