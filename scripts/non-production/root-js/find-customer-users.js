const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
require('dotenv').config({ path: '.env.local' });

// Schema simple pour vérifier les utilisateurs
const { pgTable, text } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  role: text('role'),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function findCustomerUsers() {
  try {
    console.log('🔍 Recherche des utilisateurs avec le rôle customer...\n');
    
    // Rechercher tous les utilisateurs customer
    const customerUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'customer'));
    
    console.log(`📊 Nombre d'utilisateurs customer: ${customerUsers.length}\n`);
    
    if (customerUsers.length > 0) {
      console.log('👥 Utilisateurs customer trouvés:');
      customerUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.name} (ID: ${user.id})`);
      });
      
      console.log('\n💡 Vous pouvez utiliser l\'un de ces comptes pour tester l\'onglet véhicules !');
      console.log('🔐 Si vous connaissez le mot de passe, connectez-vous avec ces identifiants.');
    } else {
      console.log('❌ Aucun utilisateur customer trouvé.');
      console.log('💡 Vous devez d\'abord créer un utilisateur avec le rôle customer depuis l\'interface admin.');
    }
    
    // Vérifier aussi tous les rôles disponibles
    console.log('\n📋 Tous les rôles utilisateurs:');
    const allUsers = await db.select().from(users).limit(10);
    const roleCount = {};
    allUsers.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });
    
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} utilisateur(s)`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

findCustomerUsers();