#!/usr/bin/env node

/**
 * Script pour assigner le rôle admin à un utilisateur
 * Usage: node scripts/assign-admin.js <clerk_user_id>
 * Exemple: node scripts/assign-admin.js user_2abc123def456
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function assignAdmin() {
  console.log('🔐 Assignment du rôle administrateur\n');

  // Récupérer l'ID utilisateur depuis les arguments ou demander
  let clerkUserId = process.argv[2];
  
  if (!clerkUserId) {
    console.log('💡 Où trouver votre ID Clerk:');
    console.log('   1. Dashboard Clerk: https://dashboard.clerk.dev');
    console.log('   2. Users > Cliquez sur l\'utilisateur > Copiez "User ID"\n');
    
    clerkUserId = await question('📋 Entrez l\'ID utilisateur Clerk (user_...): ');
  }

  if (!clerkUserId || !clerkUserId.startsWith('user_')) {
    console.error('❌ ID utilisateur Clerk invalide (doit commencer par user_)');
    process.exit(1);
  }

  console.log(`\n🔄 Assignation du rôle admin à: ${clerkUserId}`);
  console.log('💡 Plusieurs méthodes disponibles:\n');

  console.log('📋 Méthode 1 - Interface Web (Recommandée):');
  console.log('   1. Démarrez votre serveur: npm run dev');
  console.log('   2. Allez sur: http://localhost:3000/init-admin');
  console.log('   3. Collez l\'ID utilisateur et cliquez sur "Assigner"\n');

  console.log('📋 Méthode 2 - Commande cURL:');
  console.log('   curl -X POST http://localhost:3000/api/init-admin \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log(`     -d '{"clerkUserId":"${clerkUserId"}'\n`);

  console.log('📋 Méthode 3 - Base de données directe:');
  console.log('   Exécutez cette requête SQL:');
  console.log(`   INSERT INTO user_roles (clerk_user_id, role, created_at, updated_at)`);
  console.log(`   VALUES ('${clerkUserId}', 'admin', NOW(), NOW());`);

  const choice = await question('\nSouhaitez-vous ouvrir l\'interface web maintenant? (y/N): ');
  
  if (choice.toLowerCase() === 'y' || choice.toLowerCase() === 'yes') {
    const { exec } = require('child_process');
    console.log('\n🌐 Ouverture de l\'interface web...');
    
    // Essayer d'ouvrir dans le navigateur
    const url = 'http://localhost:3000/init-admin';
    const start = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${start} ${url}`, (error) => {
      if (error) {
        console.log(`💡 Ouvrez manuellement: ${url}`);
      }
    });
  }

  console.log('\n✅ Script terminé. Utilisez une des méthodes ci-dessus pour assigner le rôle admin.');
  rl.close();
}

// Exécution
assignAdmin().catch(console.error);
