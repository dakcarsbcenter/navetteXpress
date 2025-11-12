# Script de migration PostgreSQL vers Neon
# Usage: .\scripts\migrate-db-to-neon.ps1

Write-Host "🚀 Migration de la base de données vers Neon" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# URLs de connexion
$SOURCE_URL = "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress"
$DEST_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb"

# Fichier temporaire pour le dump
$DUMP_FILE = "temp_database_dump.sql"

Write-Host "📥 Étape 1: Export de la base source..." -ForegroundColor Yellow

# Export avec pg_dump
$env:PGPASSWORD = "iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY"
pg_dump -h 109.199.101.247 -p 5432 -U postgres -d navettexpress -F p -f $DUMP_FILE --no-owner --no-acl

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Export réussi: $DUMP_FILE" -ForegroundColor Green
    
    $fileSize = (Get-Item $DUMP_FILE).Length / 1KB
    Write-Host "   📊 Taille du fichier: $([math]::Round($fileSize, 2)) KB`n" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Erreur lors de l'export" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Étape 2: Import dans Neon..." -ForegroundColor Yellow

# Import avec psql
$env:PGPASSWORD = "npg_4JAmYGR2ENSu"
psql "$DEST_URL?sslmode=require" -f $DUMP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Import réussi dans Neon`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Import terminé avec avertissements`n" -ForegroundColor Yellow
}

Write-Host "🧹 Étape 3: Nettoyage..." -ForegroundColor Yellow
Remove-Item $DUMP_FILE -Force
Write-Host "   ✅ Fichier temporaire supprimé`n" -ForegroundColor Green

Write-Host "🎉 Migration terminée!" -ForegroundColor Green
Write-Host "`n💡 Conseil: Mettez à jour votre .env.local pour utiliser la base Neon" -ForegroundColor Cyan
