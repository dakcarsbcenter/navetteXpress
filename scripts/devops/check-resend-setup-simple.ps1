# Script de verification - Templates Resend
# Version simplifiee sans emojis

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION CONFIGURATION TEMPLATES RESEND" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true
$missingVars = @()

# 1. Templates HTML
Write-Host "[1/7] Templates HTML..." -ForegroundColor Yellow
$templates = @(
    "resend-templates\password-reset.html",
    "resend-templates\account-locked.html",
    "resend-templates\welcome.html"
)
foreach ($template in $templates) {
    if (Test-Path $template) {
        Write-Host "  OK  $template" -ForegroundColor Green
    } else {
        Write-Host "  ERR $template MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 2. Module d'envoi
Write-Host ""
Write-Host "[2/7] Module d'envoi..." -ForegroundColor Yellow
if (Test-Path "src\lib\email-resend-templates.ts") {
    Write-Host "  OK  src\lib\email-resend-templates.ts" -ForegroundColor Green
} else {
    Write-Host "  ERR src\lib\email-resend-templates.ts MANQUANT" -ForegroundColor Red
    $allGood = $false
}

# 3. Scripts de test
Write-Host ""
Write-Host "[3/7] Scripts de test..." -ForegroundColor Yellow
$scripts = @(
    "generate-resend-templates.ts",
    "test-resend-templates.ts"
)
foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "  OK  $script" -ForegroundColor Green
    } else {
        Write-Host "  ERR $script MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 4. Documentation
Write-Host ""
Write-Host "[4/7] Documentation..." -ForegroundColor Yellow
$docs = @(
    "CONFIGURATION_RESEND_STEP_BY_STEP.md",
    "QUICK_START_RESEND.md",
    "RESEND_TEMPLATES_USAGE.md",
    "RESUME_TEMPLATES_RESEND.md",
    ".env.resend.example"
)
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  OK  $doc" -ForegroundColor Green
    } else {
        Write-Host "  ERR $doc MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 5. Packages npm
Write-Host ""
Write-Host "[5/7] Packages npm..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$requiredPackages = @("resend", "@react-email/components")
foreach ($package in $requiredPackages) {
    if ($packageJson.dependencies.$package) {
        Write-Host "  OK  $package" -ForegroundColor Green
    } else {
        Write-Host "  ERR $package MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

# 6. Scripts npm
Write-Host ""
Write-Host "[6/7] Scripts npm..." -ForegroundColor Yellow
if ($packageJson.scripts."email:resend") {
    Write-Host "  OK  npm run email:resend" -ForegroundColor Green
} else {
    Write-Host "  ERR npm run email:resend MANQUANT" -ForegroundColor Red
    $allGood = $false
}
if ($packageJson.scripts."email:test") {
    Write-Host "  OK  npm run email:test" -ForegroundColor Green
} else {
    Write-Host "  ERR npm run email:test MANQUANT" -ForegroundColor Red
    $allGood = $false
}

# 7. Configuration .env.local
Write-Host ""
Write-Host "[7/7] Configuration .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @("RESEND_API_KEY", "RESEND_FROM_EMAIL", "NEXT_PUBLIC_APP_URL")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=.+") {
            Write-Host "  OK  $var configuree" -ForegroundColor Green
        } else {
            Write-Host "  WARN $var NON CONFIGUREE" -ForegroundColor Yellow
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host ""
        Write-Host "  >> Variables manquantes dans .env.local" -ForegroundColor Cyan
        Write-Host "  >> Voir .env.resend.example pour les valeurs" -ForegroundColor Gray
    }
} else {
    Write-Host "  WARN .env.local n'existe pas" -ForegroundColor Yellow
    Write-Host "  >> Creer depuis .env.resend.example" -ForegroundColor Gray
}

# Résumé
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan

if ($allGood -and (Test-Path ".env.local") -and $missingVars.Count -eq 0) {
    Write-Host "  STATUT: TOUT EST PRET !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "  1. Tester: npm run email:test votre@email.com" -ForegroundColor White
    Write-Host "  2. Activer: mv src\lib\email-resend-templates.ts src\lib\email.ts" -ForegroundColor White
    
} elseif ($allGood -and (Test-Path ".env.local")) {
    Write-Host "  STATUT: PRESQUE PRET - Configuration requise" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Il reste a faire:" -ForegroundColor Cyan
    Write-Host "  1. Configurer les variables manquantes dans .env.local" -ForegroundColor White
    Write-Host "  2. Lire CONFIGURATION_RESEND_STEP_BY_STEP.md" -ForegroundColor White
    
} elseif ($allGood) {
    Write-Host "  STATUT: PRESQUE PRET - Configuration requise" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Il reste a faire:" -ForegroundColor Cyan
    Write-Host "  1. Creer .env.local depuis .env.resend.example" -ForegroundColor White
    Write-Host "  2. Configurer les variables Resend" -ForegroundColor White
    Write-Host "  3. Lire CONFIGURATION_RESEND_STEP_BY_STEP.md" -ForegroundColor White
    
} else {
    Write-Host "  STATUT: CONFIGURATION INCOMPLETE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Problemes detectes - fichiers manquants" -ForegroundColor Yellow
    Write-Host "Regenerez avec: npm run email:resend" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  * CONFIGURATION_RESEND_STEP_BY_STEP.md (Guide principal)" -ForegroundColor White
Write-Host "  * QUICK_START_RESEND.md (Demarrage rapide)" -ForegroundColor White
Write-Host "  * RESEND_TEMPLATES_USAGE.md (Guide complet)" -ForegroundColor White
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
