#!/usr/bin/env bash
# Script de migration automatique Neon → Coolify PostgreSQL
# Usage: ./scripts/migrate-neon-to-coolify.sh

set -e

echo "🚀 Migration Neon → Coolify PostgreSQL"
echo "======================================"
echo ""

# URLs de connexion
NEON_URL="postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
COOLIFY_URL="postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"

# Fichiers temporaires
BACKUP_FILE="neon_backup_$(date +%Y%m%d_%H%M%S).sql"
DATA_FILE="neon_data_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Étape 1/5: Export depuis Neon..."
echo "   Fichier: $DATA_FILE"
pg_dump "$NEON_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$DATA_FILE"

if [ $? -eq 0 ]; then
    echo "   ✅ Export réussi"
else
    echo "   ❌ Échec de l'export"
    exit 1
fi

echo ""
echo "📊 Étape 2/5: Création du schéma dans Coolify..."
export DATABASE_URL="$COOLIFY_URL"
npm run db:push

if [ $? -eq 0 ]; then
    echo "   ✅ Schéma créé"
else
    echo "   ❌ Échec de la création du schéma"
    exit 1
fi

echo ""
echo "📥 Étape 3/5: Import des données dans Coolify..."
psql "$COOLIFY_URL" -f "$DATA_FILE" 2>&1 | grep -v "^$"

if [ $? -eq 0 ]; then
    echo "   ✅ Import réussi"
else
    echo "   ⚠️  Import terminé avec des avertissements"
fi

echo ""
echo "🔍 Étape 4/5: Vérification des données..."
psql "$COOLIFY_URL" -c "
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
ORDER BY table_name;
"

echo ""
echo "✅ Étape 5/5: Migration terminée!"
echo ""
echo "📝 Prochaines étapes manuelles:"
echo "   1. Vérifier les comptages ci-dessus"
echo "   2. Dans Coolify: Settings → Environment Variables"
echo "   3. Mettre à jour DATABASE_URL vers Coolify PostgreSQL"
echo "   4. Redéployer l'application"
echo "   5. Tester les fonctionnalités critiques"
echo ""
echo "💾 Backup conservé: $DATA_FILE"
echo ""
