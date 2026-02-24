// Script de test pour modifier les permissions et voir l'effet sur les menus
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testPermissionChanges() {
  try {
    console.log('🧪 Test des changements de permissions dynamiques\n');

    // Vérification de la structure des tables
    console.log('🔍 Vérification de la structure des tables...');
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%role%'
    `;
    console.log('Tables trouvées:', tables.map(t => t.table_name));

    // Vérification des colonnes de role_permissions
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'role_permissions'
    `;
    console.log('Colonnes de role_permissions:', columns);

    // 1. Afficher les permissions actuelles du rôle "driver"
    console.log('📋 Permissions actuelles du rôle "driver":');
    const currentPermissions = await sql`
      SELECT resource, action, allowed
      FROM role_permissions
      WHERE role_name = 'driver'
      ORDER BY resource, action
    `;
    
    currentPermissions.forEach(perm => {
      console.log(`  - ${perm.resource}.${perm.action}: ${perm.allowed ? '✅' : '❌'}`);
    });
    
    console.log('\n🔧 Modification des permissions...');

    // 2. Retirer la permission "manage vehicles" au driver (le menu Véhicule devrait disparaître)
    await sql`
      UPDATE role_permissions 
      SET allowed = false 
      WHERE role_name = 'driver'
      AND resource = 'vehicles'
      AND action = 'manage'
    `;
    console.log('✅ Permission "vehicles.manage" retirée au rôle driver');

    // 3. Retirer la permission "read reports" au driver (le menu Statistiques devrait disparaître)
    await sql`
      UPDATE role_permissions 
      SET allowed = false 
      WHERE role_name = 'driver'
      AND resource = 'reports'
      AND action = 'read'
    `;
    console.log('✅ Permission "reports.read" retirée au rôle driver');

    console.log('\n📋 Nouvelles permissions du rôle "driver":');
    const newPermissions = await sql`
      SELECT resource, action, allowed
      FROM role_permissions
      WHERE role_name = 'driver'
      ORDER BY resource, action
    `;
    
    newPermissions.forEach(perm => {
      console.log(`  - ${perm.resource}.${perm.action}: ${perm.allowed ? '✅' : '❌'}`);
    });

    console.log('\n🎯 Test terminé ! Les menus "Véhicule" et "Statistiques" devraient maintenant être masqués pour les drivers.');
    console.log('👉 Reconnectez-vous en tant que driver pour voir l\'effet.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Fonction pour restaurer les permissions originales
async function restorePermissions() {
  try {
    console.log('🔄 Restauration des permissions originales...');

    await sql`
      UPDATE role_permissions 
      SET allowed = true 
      WHERE role_name = 'driver'
      AND resource = 'vehicles'
      AND action = 'manage'
    `;

    await sql`
      UPDATE role_permissions 
      SET allowed = true 
      WHERE role_name = 'driver'
      AND resource = 'reports'
      AND action = 'read'
    `;

    console.log('✅ Permissions restaurées !');
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  }
}

// Vérifier l'argument de commande
const action = process.argv[2];

if (action === 'restore') {
  restorePermissions();
} else {
  testPermissionChanges();
}