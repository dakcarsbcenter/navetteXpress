const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
require('dotenv').config({ path: '.env.local' });

// Schema simple pour vérifier les utilisateurs
const { pgTable, text, timestamp, boolean } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  password: text('password'),
  role: text('role'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at'),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function checkAuthIssue() {
  try {
    console.log('🔍 Vérification de la configuration d\'authentification...\n');
    
    // 1. Vérifier les utilisateurs existants
    const allUsers = await db.select().from(users).limit(10);
    console.log(`📊 Nombre total d'utilisateurs: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\n👥 Premiers utilisateurs:');
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - Rôle: ${user.role} - A un mot de passe: ${!!user.password}`);
      });
      
      // 2. Vérifier les utilisateurs avec mots de passe
      const usersWithPassword = allUsers.filter(u => u.password);
      console.log(`\n🔐 Utilisateurs avec mot de passe: ${usersWithPassword.length}`);
      
      if (usersWithPassword.length > 0) {
        console.log('\n🔍 Premier utilisateur avec mot de passe:');
        const firstUser = usersWithPassword[0];
        console.log(`  Email: ${firstUser.email}`);
        console.log(`  Rôle: ${firstUser.role}`);
        console.log(`  Hash du mot de passe commence par: ${firstUser.password?.substring(0, 10)}...`);
        console.log(`  Actif: ${firstUser.isActive}`);
      }
      
      // 3. Vérifier si ce sont des utilisateurs Clerk ou NextAuth
      const clerkUsers = allUsers.filter(u => !u.password);
      console.log(`\n🎯 Utilisateurs probablement Clerk (sans mdp): ${clerkUsers.length}`);
    } else {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
    }
    
    // 4. Vérifier la configuration
    console.log('\n⚙️  Configuration:');
    console.log(`  NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Défini' : '❌ Manquant'}`);
    console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Défini' : '❌ Manquant'}`);
    console.log(`  CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? '✅ Défini (Clerk actif)' : '❌ Manquant'}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkAuthIssue();