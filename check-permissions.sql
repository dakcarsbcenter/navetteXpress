-- Script SQL pour vérifier toutes les permissions
-- Exécuter ce script dans votre base de données PostgreSQL

-- 1. Afficher toutes les permissions par rôle
SELECT 
  role_name,
  resource,
  action,
  allowed,
  created_at
FROM role_permissions
ORDER BY role_name, resource, action;

-- 2. Permissions actives pour le rôle CUSTOMER
SELECT 
  resource,
  STRING_AGG(action, ', ' ORDER BY action) as actions
FROM role_permissions
WHERE role_name = 'customer' AND allowed = true
GROUP BY resource
ORDER BY resource;

-- 3. Permissions actives pour le rôle DRIVER
SELECT 
  resource,
  STRING_AGG(action, ', ' ORDER BY action) as actions
FROM role_permissions
WHERE role_name = 'driver' AND allowed = true
GROUP BY resource
ORDER BY resource;

-- 4. Permissions actives pour le rôle ADMIN
SELECT 
  resource,
  STRING_AGG(action, ', ' ORDER BY action) as actions
FROM role_permissions
WHERE role_name = 'admin' AND allowed = true
GROUP BY resource
ORDER BY resource;

-- 5. Compter le nombre de permissions par rôle
SELECT 
  role_name,
  COUNT(*) FILTER (WHERE allowed = true) as active_permissions,
  COUNT(*) FILTER (WHERE allowed = false) as disabled_permissions,
  COUNT(*) as total_permissions
FROM role_permissions
GROUP BY role_name
ORDER BY role_name;

-- 6. Vérifier quels utilisateurs ont des permissions étendues
SELECT 
  u.email,
  u.role,
  COUNT(rp.id) FILTER (WHERE rp.allowed = true) as permissions_count
FROM users u
LEFT JOIN role_permissions rp ON u.role = rp.role_name
WHERE u.role IN ('customer', 'driver')
GROUP BY u.id, u.email, u.role
ORDER BY permissions_count DESC;
