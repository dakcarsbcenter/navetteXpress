-- Corridor Dakar <-> Saint-Louis (campagne de recrutement 2026, groupe B).
--
-- Seed manuel, hors sequence drizzle : il cree des DONNEES, pas du schema, et ne
-- doit pas etre rejoue par drizzle-kit migrate. A executer une fois par base
-- (idempotent : les deux INSERT sont gardes).
--
-- ATTENTION : les trois valeurs distance / duree / tarif sont des PLACEHOLDERS
-- non valides par le client. Le segment est donc cree avec is_active = false :
-- /api/pricing-segments et matchPricingSegments() filtrent sur is_active, donc
-- rien n'est publie sur /tarifs et aucun prix n'est propose au client. Le trajet
-- reste reservable "sur devis", l'admin fixe le prix a la main. Passer
-- is_active = true (depuis l'admin Tarifs) une fois les montants confirmes.

INSERT INTO locations (name, is_active)
VALUES ('SAINT LOUIS', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pricing_segments
  (route, distance, duree, berline, suv, dot, zones, depart_node, arrivee_node, sort_order, is_active)
SELECT
  'Dakar → Saint-Louis', '270 km', '~4h', 125000, 150000, 'ink',
  ARRAY['dakar'], 'DAKAR', 'SAINT_LOUIS', 90, false
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_segments
  WHERE depart_node = 'DAKAR' AND arrivee_node = 'SAINT_LOUIS'
);
