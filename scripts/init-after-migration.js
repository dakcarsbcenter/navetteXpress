const { updateExistingUsers } = require('./update-existing-users');
const { initPermissions } = require('./init-permissions');
const { createAdmin } = require('./create-admin');

async function initAfterMigration() {
  console.log('🚀 Initialisation post-migration...');
  
  try {
    // 1. Mettre à jour les utilisateurs existants
    console.log('\n📝 Étape 1: Mise à jour des utilisateurs existants');
    await updateExistingUsers();
    
    // 2. Initialiser les permissions
    console.log('\n🔐 Étape 2: Initialisation des permissions');
    await initPermissions();
    
    // 3. Créer l'utilisateur admin
    console.log('\n👑 Étape 3: Création de l\'utilisateur admin');
    await createAdmin();
    
    console.log('\n🎉 Initialisation post-migration terminée avec succès !');
    console.log('\n📋 Résumé des actions:');
    console.log('   ✅ Utilisateurs existants mis à jour');
    console.log('   ✅ Permissions initialisées');
    console.log('   ✅ Utilisateur admin créé');
    console.log('\n🔑 Connexion admin:');
    console.log('   📧 Email: admin@navettexpress.com');
    console.log('   🔑 Mot de passe: admin123');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  initAfterMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { initAfterMigration };
