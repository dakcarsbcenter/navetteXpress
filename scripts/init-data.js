const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

async function initData() {
  console.log('🚀 Initialisation des données...');
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // 1. Créer l'utilisateur admin
    console.log('👑 Création de l\'utilisateur admin...');
    const adminEmail = 'admin@navettexpress.com';
    const adminPassword = 'admin123';
    const adminName = 'Administrateur Navette Xpress';
    const adminId = randomUUID();
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    try {
      await sql`
        INSERT INTO users (id, name, email, password, role, phone, license_number, is_active, email_verified, created_at, updated_at)
        VALUES (${adminId}, ${adminName}, ${adminEmail}, ${hashedPassword}, 'admin', '+33123456789', 'ADMIN001', true, NOW(), NOW(), NOW())
      `;
      console.log('✅ Utilisateur admin créé');
    } catch (error) {
      console.log('⚠️  Utilisateur admin existe déjà');
    }
    
    // 2. Initialiser les permissions admin
    console.log('🔐 Initialisation des permissions admin...');
    const adminPermissions = [
      ['admin', 'bookings', 'create', true],
      ['admin', 'bookings', 'read', true],
      ['admin', 'bookings', 'update', true],
      ['admin', 'bookings', 'delete', true],
      ['admin', 'vehicles', 'create', true],
      ['admin', 'vehicles', 'read', true],
      ['admin', 'vehicles', 'update', true],
      ['admin', 'vehicles', 'delete', true],
      ['admin', 'users', 'create', true],
      ['admin', 'users', 'read', true],
      ['admin', 'users', 'update', true],
      ['admin', 'users', 'delete', true],
      ['admin', 'planning', 'create', true],
      ['admin', 'planning', 'read', true],
      ['admin', 'planning', 'update', true],
      ['admin', 'planning', 'delete', true],
    ];
    
    for (const [role, resource, action, allowed] of adminPermissions) {
      try {
        await sql`
          INSERT INTO permissions (role, resource, action, allowed, created_at)
          VALUES (${role}, ${resource}, ${action}, ${allowed}, NOW())
        `;
      } catch (error) {
        // Permission existe déjà
      }
    }
    console.log('✅ Permissions admin initialisées');
    
    // 3. Initialiser les permissions chauffeur
    console.log('🚗 Initialisation des permissions chauffeur...');
    const chauffeurPermissions = [
      ['chauffeur', 'bookings', 'read', true],
      ['chauffeur', 'bookings', 'update', true],
      ['chauffeur', 'vehicles', 'read', true],
      ['chauffeur', 'users', 'read', false],
      ['chauffeur', 'planning', 'read', true],
    ];
    
    for (const [role, resource, action, allowed] of chauffeurPermissions) {
      try {
        await sql`
          INSERT INTO permissions (role, resource, action, allowed, created_at)
          VALUES (${role}, ${resource}, ${action}, ${allowed}, NOW())
        `;
      } catch (error) {
        // Permission existe déjà
      }
    }
    console.log('✅ Permissions chauffeur initialisées');
    
    console.log('🎉 Initialisation des données terminée avec succès !');
    console.log('\n📋 Résumé:');
    console.log('   ✅ Utilisateur admin créé');
    console.log('   ✅ Permissions admin initialisées');
    console.log('   ✅ Permissions chauffeur initialisées');
    console.log('\n🔑 Connexion admin:');
    console.log('   📧 Email: admin@navettexpress.com');
    console.log('   🔑 Mot de passe: admin123');
    console.log('   ⚠️  Changez le mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  initData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { initData };
