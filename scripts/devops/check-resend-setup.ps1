# 🚀 Script de Préparation - Templates Resend
# Ce script vérifie que tout est prêt pour la configuration

Write-Host "`n🔍 Vérification de la configuration Templates Resend`n" -ForegroundColor Cyan

$allGood = $true

# 1. Vérifier que les templates HTML existent
Write-Host "1️⃣ Vérification des templates HTML..." -ForegroundColor Yellow

$templates = @(
    "resend-templates\password-reset.html",
    "resend-templates\account-locked.html",
    "resend-templates\welcome.html"
)

foreach ($template in $templates) {
    if (Test-Path $template) {
        Write-Host "   ✅ $template" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $template MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 2. Vérifier que le module existe
Write-Host "`n2️⃣ Vérification du module d'envoi..." -ForegroundColor Yellow

if (Test-Path "src\lib\email-resend-templates.ts") {
    Write-Host "   ✅ src\lib\email-resend-templates.ts" -ForegroundColor Green
} else {
    Write-Host "   ❌ src\lib\email-resend-templates.ts MANQUANT" -ForegroundColor Red
    $allGood = $false
}

# 3. Vérifier que les scripts de test existent
Write-Host "`n3️⃣ Vérification des scripts de test..." -ForegroundColor Yellow

$scripts = @(
    "generate-resend-templates.ts",
    "test-resend-templates.ts"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "   ✅ $script" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $script MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 4. Vérifier la documentation
Write-Host "`n4️⃣ Vérification de la documentation..." -ForegroundColor Yellow

$docs = @(
    "CONFIGURATION_RESEND_STEP_BY_STEP.md",
    "QUICK_START_RESEND.md",
    "RESEND_TEMPLATES_USAGE.md",
    "RESUME_TEMPLATES_RESEND.md",
    ".env.resend.example"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $doc MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 5. Vérifier les packages npm
Write-Host "`n5️⃣ Vérification des packages npm..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

$requiredPackages = @("resend", "@react-email/components")
$missingPackages = @()

foreach ($package in $requiredPackages) {
    if ($packageJson.dependencies.$package) {
        Write-Host "   ✅ $package installé" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $package MANQUANT" -ForegroundColor Red
        $missingPackages += $package
        $allGood = $false
    }
}

# 6. Vérifier les scripts npm
Write-Host "`n6️⃣ Vérification des scripts npm..." -ForegroundColor Yellow

$requiredScripts = @{
    "email:resend" = "npx tsx generate-resend-templates.ts"
    "email:test" = "npx tsx test-resend-templates.ts"
}

foreach ($scriptName in $requiredScripts.Keys) {
    if ($packageJson.scripts.$scriptName) {
        Write-Host "   ✅ npm run $scriptName" -ForegroundColor Green
    } else {
        Write-Host "   ❌ npm run $scriptName MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 7. Vérifier .env.local
Write-Host "`n7️⃣ Vérification de .env.local..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @(
        "RESEND_API_KEY",
        "RESEND_FROM_EMAIL",
        "NEXT_PUBLIC_APP_URL"
    )
    
    $configuredVars = @()
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=.+") {
            Write-Host "   ✅ $var configurée" -ForegroundColor Green
            $configuredVars += $var
        } else {
            Write-Host "   ⚠️  $var NON CONFIGURÉE" -ForegroundColor Yellow
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "`n   💡 Variables manquantes a ajouter dans .env.local:" -ForegroundColor Cyan
        Write-Host "      Voir .env.resend.example pour les valeurs" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️  .env.local n'existe pas" -ForegroundColor Yellow
    Write-Host "      Créez-le avec les variables de .env.resend.example" -ForegroundColor Gray
}

# Résumé final
Write-Host "`n" + "="*60 -ForegroundColor Cyan

if ($allGood -and (Test-Path ".env.local") -and $missingVars.Count -eq 0) {
    Write-Host "✅ TOUT EST PRÊT !" -ForegroundColor Green
    Write-Host "`nVous pouvez maintenant :" -ForegroundColor Cyan
    Write-Host "  1. Tester l'envoi : npm run email:test votre@email.com" -ForegroundColor White
    Write-Host "  2. Activer le module : mv src\lib\email-resend-templates.ts src\lib\email.ts" -ForegroundColor White
} elseif ($allGood -and (Test-Path ".env.local")) {
    Write-Host "PRESQUE PRET - Configuration requise" -ForegroundColor Yellow
    Write-Host "`nIl reste a faire :" -ForegroundColor Cyan
    Write-Host "  1. Configurer les variables manquantes dans .env.local" -ForegroundColor White
    Write-Host "  2. Lire CONFIGURATION_RESEND_STEP_BY_STEP.md" -ForegroundColor White
} elseif ($allGood) {
    Write-Host "PRESQUE PRET - Configuration requise" -ForegroundColor Yellow
    Write-Host "`nIl reste a faire :" -ForegroundColor Cyan
    Write-Host "  1. Creer .env.local depuis .env.resend.example" -ForegroundColor White
    Write-Host "  2. Configurer les variables Resend" -ForegroundColor White
    Write-Host "  3. Lire CONFIGURATION_RESEND_STEP_BY_STEP.md" -ForegroundColor White
} else {
    Write-Host "CONFIGURATION INCOMPLETE" -ForegroundColor Red
    Write-Host "`nProblemes detectes - fichiers manquants" -ForegroundColor Yellow
    Write-Host "Regenerez les fichiers ou contactez le developpeur" -ForegroundColor Gray
}

Write-Host "`n📖 Documentation disponible :" -ForegroundColor Cyan
Write-Host "   • CONFIGURATION_RESEND_STEP_BY_STEP.md (Guide principal)" -ForegroundColor White
Write-Host "   • QUICK_START_RESEND.md (Démarrage rapide)" -ForegroundColor White
Write-Host "   • RESEND_TEMPLATES_USAGE.md (Guide complet)" -ForegroundColor White

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host ""
