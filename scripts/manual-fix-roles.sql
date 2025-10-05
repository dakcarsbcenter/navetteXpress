-- Mettre à jour les rôles 'driver' vers 'chauffeur' avant de modifier l'enum
UPDATE users SET role = 'chauffeur' WHERE role = 'driver';
UPDATE permissions SET role = 'chauffeur' WHERE role = 'driver';

-- Vérifier les changements
SELECT role, COUNT(*) as count FROM users GROUP BY role;
SELECT role, COUNT(*) as count FROM permissions GROUP BY role;
