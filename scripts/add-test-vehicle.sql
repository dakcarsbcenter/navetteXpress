-- Script pour ajouter un véhicule de test dans la base de données
-- À exécuter dans votre console PostgreSQL/Neon pour tester l'intégration

-- Ajouter un véhicule Mercedes-Benz Classe S
INSERT INTO vehicles (
  make,
  model,
  year,
  "plateNumber",
  capacity,
  "vehicleType",
  photo,
  category,
  description,
  features,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'Mercedes-Benz',
  'Classe S',
  2023,
  'TEST-001-MB',
  4,
  'luxury',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center',
  'Berline de Luxe',
  'L''excellence allemande pour vos déplacements d''affaires et occasions spéciales.',
  '["Cuir premium", "Climatisation multi-zones", "Wi-Fi gratuit", "Boissons offertes"]',
  true,
  NOW(),
  NOW()
);

-- Ajouter un BMW Série 7
INSERT INTO vehicles (
  make,
  model,
  year,
  "plateNumber",
  capacity,
  "vehicleType",
  photo,
  category,
  description,
  features,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'BMW',
  'Série 7',
  2023,
  'TEST-002-BMW',
  4,
  'luxury',
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center',
  'Berline Executive',
  'Confort et technologie de pointe pour un voyage d''exception.',
  '["Sièges massants", "Système audio premium", "Écrans arrière", "Minibar"]',
  true,
  NOW(),
  NOW()
);

-- Ajouter un Audi A8
INSERT INTO vehicles (
  make,
  model,
  year,
  "plateNumber",
  capacity,
  "vehicleType",
  photo,
  category,
  description,
  features,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'Audi',
  'A8',
  2024,
  'TEST-003-AUDI',
  4,
  'luxury',
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center',
  'Berline Premium',
  'Innovation et élégance pour tous vos trajets professionnels.',
  '["Conduite semi-autonome", "Éclairage ambiant", "Isolation phonique", "Chargeurs sans fil"]',
  true,
  NOW(),
  NOW()
);

-- Vérifier les véhicules ajoutés
SELECT 
  id,
  make,
  model,
  "plateNumber",
  category,
  "isActive"
FROM vehicles
ORDER BY "createdAt" DESC
LIMIT 10;

-- Pour supprimer les véhicules de test (si besoin)
-- DELETE FROM vehicles WHERE "plateNumber" LIKE 'TEST-%';


