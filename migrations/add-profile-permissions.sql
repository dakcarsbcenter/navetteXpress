-- Migration : Ajout des permissions "profile" pour tous les rôles
-- Date : 2025-11-10
-- Description : Ajoute les permissions de lecture et modification du profil utilisateur

-- 1. Ajouter les permissions pour le rôle customer (clients)
INSERT INTO role_permissions (role_name, resource, action, allowed, created_at, updated_at)
VALUES 
  ('customer', 'profile', 'read', true, NOW(), NOW()),
  ('customer', 'profile', 'update', true, NOW(), NOW())
ON CONFLICT (role_name, resource, action) DO UPDATE
SET allowed = true, updated_at = NOW();

-- 2. Ajouter les permissions pour le rôle driver (chauffeurs)
INSERT INTO role_permissions (role_name, resource, action, allowed, created_at, updated_at)
VALUES 
  ('driver', 'profile', 'read', true, NOW(), NOW()),
  ('driver', 'profile', 'update', true, NOW(), NOW())
ON CONFLICT (role_name, resource, action) DO UPDATE
SET allowed = true, updated_at = NOW();

-- 3. Ajouter les permissions pour le rôle manager
INSERT INTO role_permissions (role_name, resource, action, allowed, created_at, updated_at)
VALUES 
  ('manager', 'profile', 'read', true, NOW(), NOW()),
  ('manager', 'profile', 'update', true, NOW(), NOW())
ON CONFLICT (role_name, resource, action) DO UPDATE
SET allowed = true, updated_at = NOW();

-- 4. Ajouter les permissions pour le rôle admin (toujours autorisé)
INSERT INTO role_permissions (role_name, resource, action, allowed, created_at, updated_at)
VALUES 
  ('admin', 'profile', 'read', true, NOW(), NOW()),
  ('admin', 'profile', 'update', true, NOW(), NOW())
ON CONFLICT (role_name, resource, action) DO UPDATE
SET allowed = true, updated_at = NOW();

-- Vérifier les permissions ajoutées
SELECT role_name, resource, action, allowed 
FROM role_permissions 
WHERE resource = 'profile'
ORDER BY role_name, action;
