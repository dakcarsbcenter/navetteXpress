#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration Google OAuth
 */

console.log('🔍 Vérification de la configuration Google OAuth...\n')

// Vérifier les variables d'environnement
require('dotenv').config({ path: '.env.local' })

const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
]

let allConfigured = true

requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value && value.trim() !== '') {
    console.log(`✅ ${varName}: Configuré`)
  } else {
    console.log(`❌ ${varName}: Manquant ou vide`)
    allConfigured = false
  }
})

console.log('\n' + '='.repeat(50))

if (allConfigured) {
  console.log('✅ Toutes les variables sont configurées!')
  console.log('🚀 Vous pouvez maintenant utiliser l\'authentification Google')
  console.log('\n📝 Pour tester:')
  console.log('1. Démarrez le serveur: npm run dev')
  console.log('2. Allez sur: http://localhost:3000/auth/signin')
  console.log('3. Cliquez sur "Continuer avec Google"')
} else {
  console.log('⚠️  Configuration incomplète!')
  console.log('\n📋 Étapes suivantes:')
  console.log('1. Consultez le fichier GOOGLE_OAUTH_SETUP.md')
  console.log('2. Configurez votre projet Google Cloud Console')
  console.log('3. Ajoutez vos credentials dans .env.local')
  console.log('4. Redémarrez votre serveur de développement')
}

console.log('\n📚 Documentation: GOOGLE_OAUTH_SETUP.md')
console.log('🔗 Console Google: https://console.cloud.google.com/')