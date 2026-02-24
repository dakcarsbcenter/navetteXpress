require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkCurrentUser() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Vérification des utilisateurs admin...\n');
    
    const users = await sql`SELECT id, name, email, role FROM users WHERE role = 'admin' ORDER BY name`;
    
    console.log(`📊 Total admins: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nom: ${user.name}`);
      console.log(`   Rôle: ${user.role}\n`);
    });
    
    // Vérifier tous les utilisateurs
    const allUsers = await sql`SELECT id, name, email, role FROM users ORDER BY role, name`;
    
    console.log(`\n📋 Tous les utilisateurs (${allUsers.length}):`);
    const groupedByRole = {};
    allUsers.forEach(user => {
      if (!groupedByRole[user.role]) {
        groupedByRole[user.role] = [];
      }
      groupedByRole[user.role].push(user);
    });
    
    Object.entries(groupedByRole).forEach(([role, users]) => {
      console.log(`\n🎭 Rôle: ${role} (${users.length} utilisateur(s))`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkCurrentUser().then(() => {
  console.log('\n✅ Vérification terminée');
  process.exit(0);
}).catch(console.error);
