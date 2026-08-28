-- Correctif : 403 sur /api/client/profile et /api/quotes/client, 500 sur /api/client/bookings
-- Date : 2026-08-28
-- Contexte : voir docs/GUIDE_DEPLOIEMENT_PRODUCTION.md, chapitre 9 (dérive de migrations)
--
-- Diagnostic :
--   1) "bookings" n'a probablement jamais reçu les colonnes price_proposed_at /
--      client_response / client_response_at / client_response_message : aucun
--      fichier migrations/*.sql ne contient l'ALTER TABLE correspondant, alors que
--      ces colonnes sont dans schema.ts depuis la migration 0010. La route
--      GET /api/client/bookings les sélectionne -> erreur SQL -> 500.
--   2) La table role_permissions a été créée (migration 0008_youthful_devos.sql)
--      avec une contrainte CHECK, PAS une contrainte UNIQUE sur
--      (role_name, resource, action). Le script migrations/add-profile-permissions.sql
--      utilise "ON CONFLICT (role_name, resource, action)" qui ne peut correspondre à
--      aucune contrainte -> il échoue et n'a donc jamais inséré les permissions
--      "profile". Plusieurs versions de restructure-permissions*.sql font en plus un
--      TRUNCATE TABLE role_permissions suivi d'INSERT syntaxiquement invalides
--      (nombre de colonnes/valeurs différent), ce qui a pu vider la table sans la
--      repeupler correctement -> 403 pour "profile" et "quotes".
--
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans risque, et ne
-- fait AUCUN TRUNCATE (il n'écrase aucune permission existante en dehors de
-- "profile"/"quotes", qu'il remet juste à allowed = true).

BEGIN;

-- 1) Colonnes manquantes sur "bookings"
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "price_proposed_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_response" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_response_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_response_message" text;

-- 2) S'assurer que les rôles de base existent (custom_roles.name est déjà UNIQUE)
--    updated_at/created_at fournis explicitement : la colonne updated_at est
--    NOT NULL sans défaut réel en prod malgré defaultNow() dans schema.ts.
INSERT INTO "custom_roles" (name, display_name, is_system, created_at, updated_at)
VALUES
  ('admin', 'Administrateur', true, now(), now()),
  ('manager', 'Manager', true, now(), now()),
  ('customer', 'Client', true, now(), now()),
  ('driver', 'Chauffeur', true, now(), now())
ON CONFLICT (name) DO NOTHING;

-- 3) Dédoublonner role_permissions avant de poser une contrainte unique
--    (garde la ligne la plus récente pour chaque triplet role/resource/action)
DELETE FROM "role_permissions" rp
USING "role_permissions" rp2
WHERE rp.role_name = rp2.role_name
  AND rp.resource = rp2.resource
  AND rp.action = rp2.action
  AND rp.id < rp2.id;

-- 4) Ajouter la contrainte unique qui manquait réellement en prod
--    (nécessaire pour que ON CONFLICT fonctionne, et pour empêcher que ce bug se
--    reproduise avec un futur script d'administration des permissions)
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_resource_action_idx"
  ON "role_permissions" ("role_name", "resource", "action");

-- 5) Permissions "profile" (lecture + modification de son propre profil)
--    created_at fourni explicitement pour la même raison qu'au point 2.
INSERT INTO "role_permissions" (role_name, resource, action, allowed, created_at) VALUES
  ('admin',    'profile', 'read',   true, now()),
  ('admin',    'profile', 'update', true, now()),
  ('manager',  'profile', 'read',   true, now()),
  ('manager',  'profile', 'update', true, now()),
  ('customer', 'profile', 'read',   true, now()),
  ('customer', 'profile', 'update', true, now()),
  ('driver',   'profile', 'read',   true, now()),
  ('driver',   'profile', 'update', true, now())
ON CONFLICT ("role_name", "resource", "action") DO UPDATE SET allowed = true;

-- 6) Permission "quotes" en lecture pour customer (+ réaffirmation admin/manager)
INSERT INTO "role_permissions" (role_name, resource, action, allowed, created_at) VALUES
  ('admin',    'quotes', 'read', true, now()),
  ('manager',  'quotes', 'read', true, now()),
  ('customer', 'quotes', 'read', true, now())
ON CONFLICT ("role_name", "resource", "action") DO UPDATE SET allowed = true;

COMMIT;

-- Vérification (à lancer aussi séparément après coup si besoin) :
SELECT role_name, resource, action, allowed
FROM role_permissions
WHERE resource IN ('profile', 'quotes')
ORDER BY role_name, resource, action;

\d bookings
