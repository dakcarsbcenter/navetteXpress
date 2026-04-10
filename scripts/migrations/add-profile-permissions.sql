-- Script pour ajouter les permissions de profil aux clients
-- Date: 2025-11-10

-- Vérifier si la table role_permissions existe
DO $$ 
BEGIN
    -- Ajouter la permission de lecture du profil pour les clients
    INSERT INTO role_permissions (role_name, resource, action, allowed, description)
    VALUES ('customer', 'profile', 'read', true, 'Permission de lire son propre profil')
    ON CONFLICT (role_name, resource, action) DO UPDATE
    SET allowed = true, description = 'Permission de lire son propre profil';

    -- Ajouter la permission de modification du profil pour les clients
    INSERT INTO role_permissions (role_name, resource, action, allowed, description)
    VALUES ('customer', 'profile', 'update', true, 'Permission de modifier son propre profil (nom, email, téléphone, photo)')
    ON CONFLICT (role_name, resource, action) DO UPDATE
    SET allowed = true, description = 'Permission de modifier son propre profil (nom, email, téléphone, photo)';

    -- Ajouter les permissions pour les managers aussi
    INSERT INTO role_permissions (role_name, resource, action, allowed, description)
    VALUES ('manager', 'profile', 'read', true, 'Permission de lire son propre profil')
    ON CONFLICT (role_name, resource, action) DO UPDATE
    SET allowed = true;

    INSERT INTO role_permissions (role_name, resource, action, allowed, description)
    VALUES ('manager', 'profile', 'update', true, 'Permission de modifier son propre profil')
    ON CONFLICT (role_name, resource, action) DO UPDATE
    SET allowed = true;

    -- Ajouter les permissions pour les drivers aussi
    INSERT INTO role_permissions (role_name, resource, action, allowed, description)
    VALUES ('driver', 'profile', 'read', true, 'Permission de lire son propre profil')
    ON CONFLICT (role_name, resource, action) DO UPDATE
    SET allowed = true;

    INSERT INTO role_permissions (role_name, resource, action, allowed, description)
    VALUES ('driver', 'profile', 'update', true, 'Permission de modifier son propre profil')
    ON CONFLICT (role_name, resource, action) DO UPDATE
    SET allowed = true;

    RAISE NOTICE 'Permissions de profil ajoutées avec succès pour customer, manager et driver';
END $$;

-- Vérifier les permissions ajoutées
SELECT role_name, resource, action, allowed, description 
FROM role_permissions 
WHERE resource = 'profile'
ORDER BY role_name, action;
