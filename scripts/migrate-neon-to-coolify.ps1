# Script PowerShell de migration Neon → Coolify PostgreSQL
# Usage: .\scripts\migrate-neon-to-coolify.ps1

Write-Host "🚀 Migration Neon → Coolify PostgreSQL" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# URLs de connexion
$NEON_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
$COOLIFY_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"

# Fichiers temporaires
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DATA_FILE = "neon_data_$timestamp.sql"

Write-Host "📦 Étape 1/5: Export depuis Neon..." -ForegroundColor Yellow
Write-Host "   Fichier: $DATA_FILE"

try {
    & pg_dump $NEON_URL --data-only --no-owner --no-privileges --format=plain --file=$DATA_FILE
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Export réussi" -ForegroundColor Green
    } else {
        throw "Échec de l'export"
    }
} catch {
    Write-Host "   ❌ Échec de l'export: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Assurez-vous que PostgreSQL client (pg_dump) est installé:" -ForegroundColor Yellow
    Write-Host "   - Télécharger: https://www.postgresql.org/download/windows/"
    Write-Host "   - Ou utiliser: choco install postgresql"
    Write-Host "   - Ou utiliser le script Node.js: node scripts/migrate-db.js"
    exit 1
}

Write-Host ""
Write-Host "📊 Étape 2/5: Création du schéma dans Coolify..." -ForegroundColor Yellow
$env:DATABASE_URL = $COOLIFY_URL

try {
    npm run db:push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Schéma créé" -ForegroundColor Green
    } else {
        throw "Échec de la création du schéma"
    }
} catch {
    Write-Host "   ❌ Échec: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📥 Étape 3/5: Import des données dans Coolify..." -ForegroundColor Yellow

try {
    & psql $COOLIFY_URL -f $DATA_FILE
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Import réussi" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Import terminé avec des avertissements" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    Write-Host "   ℹ️  Si la connexion échoue, vérifiez que db-navettexpress est accessible" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "🔍 Étape 4/5: Vérification des données..." -ForegroundColor Yellow

$verifyQuery = @"
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
"@

try {
    & psql $COOLIFY_URL -c $verifyQuery
} catch {
    Write-Host "   ⚠️  Impossible de vérifier les données" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Étape 5/5: Migration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes manuelles:" -ForegroundColor Cyan
Write-Host "   1. Vérifier les comptages ci-dessus"
Write-Host "   2. Dans Coolify: Settings → Environment Variables"
Write-Host "   3. Mettre à jour DATABASE_URL vers Coolify PostgreSQL"
Write-Host "   4. Redéployer l'application"
Write-Host "   5. Tester les fonctionnalités critiques"
Write-Host ""
Write-Host "💾 Backup conservé: $DATA_FILE" -ForegroundColor Cyan
Write-Host ""
