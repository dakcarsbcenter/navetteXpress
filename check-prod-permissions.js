const { Client } = require('pg');

const prodConfig = {
  host: '109.199.101.247',
  port: 5432,
  database: 'navettexpress',
  user: 'postgres',
  password: 'iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY',
  ssl: false
};

async function checkPermissions() {
  const client = new Client(prodConfig);
  
  try {
    console.log('🔍 Vérification des permissions en PRODUCTION\n');
    console.log('='.repeat(80));
    
    await client.connect();
    console.log('✅ Connecté à la base PROD\n');
    
    // 1. Vérifier les utilisateurs admin
    const admins = await client.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE role = 'admin'
      ORDER BY name
    `);
    
    console.log(`📋 Utilisateurs ADMIN: ${admins.rows.length}\n`);
    admins.rows.forEach((admin, i) => {
      console.log(`${i + 1}. ${admin.name} (${admin.email})`);
      console.log(`   ID: ${admin.id}\n`);
    });
    
    // 2. Vérifier les permissions
    const permissions = await client.query(`
      SELECT role_name, resource, action, allowed
      FROM role_permissions
      WHERE role_name = 'admin'
      ORDER BY resource, action
    `);
    
    console.log(`📋 Permissions ADMIN: ${permissions.rows.length}\n`);
    
    if (permissions.rows.length === 0) {
      console.log('❌ AUCUNE PERMISSION TROUVÉE POUR LE RÔLE ADMIN!\n');
      console.log('⚠️  C\'est probablement la cause des erreurs 403\n');
    } else {
      const grouped = {};
      permissions.rows.forEach(perm => {
        if (!grouped[perm.resource]) grouped[perm.resource] = [];
        grouped[perm.resource].push(perm.action);
      });
      
      Object.entries(grouped).forEach(([resource, actions]) => {
        console.log(`✅ ${resource}: ${actions.join(', ')}`);
      });
    }
    
    // 3. Vérifier spécifiquement les permissions bookings
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 Vérification des permissions BOOKINGS\n');
    
    const bookingsPerms = await client.query(`
      SELECT role_name, action, allowed
      FROM role_permissions
      WHERE resource = 'bookings'
      ORDER BY role_name, action
    `);
    
    if (bookingsPerms.rows.length === 0) {
      console.log('❌ Aucune permission BOOKINGS trouvée!\n');
    } else {
      console.log('📋 Permissions existantes:\n');
      bookingsPerms.rows.forEach(perm => {
        const icon = perm.allowed ? '✅' : '❌';
        console.log(`   ${icon} ${perm.role_name}.bookings.${perm.action}`);
      });
    }
    
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    await client.end();
    process.exit(1);
  }
}

checkPermissions().then(() => {
  console.log('\n✅ Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
