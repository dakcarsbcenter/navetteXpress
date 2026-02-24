require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function checkData() {
  console.log('🔍 Vérification des données...\n');
  
  // Vérifier les rôles
  const roles = await sql`SELECT DISTINCT role_name FROM role_permissions ORDER BY role_name`;
  console.log('Rôles dans role_permissions:', roles.map(r => r.role_name));
  
  // Vérifier toutes les permissions
  const allPermissions = await sql`SELECT * FROM role_permissions ORDER BY role_name, resource, action`;
  console.log('\nToutes les permissions:');
  allPermissions.forEach(p => {
    console.log(`  ${p.role_name}: ${p.resource}.${p.action} = ${p.allowed ? '✅' : '❌'}`);
  });
  
  // Vérifier les custom_roles
  const customRoles = await sql`SELECT * FROM custom_roles ORDER BY name`;
  console.log('\nRôles dans custom_roles:');
  customRoles.forEach(r => {
    console.log(`  - ${r.name} (ID: ${r.id})`);
  });
}

checkData().catch(console.error);