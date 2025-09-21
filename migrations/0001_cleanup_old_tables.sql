-- Migration pour supprimer les anciennes tables users_table et posts_table

-- Supprimer la table posts_table (avec ses contraintes de clé étrangère)
DROP TABLE IF EXISTS "posts_table" CASCADE;

-- Supprimer la table users_table
DROP TABLE IF EXISTS "users_table" CASCADE;
