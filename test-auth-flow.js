const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Schema pour tester l'authentification
const { pgTable, text } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  password: text('password'),
  role: text('role'),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function testAuthFlow() {
  try {
    console.log('🧪 Test du flux d\'authentification NextAuth\n');
    
    const testEmail = 'admin@navettehub.com';
    const testPassword = 'admin123';
    
    console.log(`📧 Email de test: ${testEmail}`);
    console.log(`🔑 Mot de passe de test: ${testPassword}\n`);
    
    // 1. Récupérer l'utilisateur
    console.log('1️⃣ Recherche de l\'utilisateur...');
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    if (userResult.length === 0) {
      console.log('❌ Utilisateur non trouvé !');
      return;
    }
    
    const user = userResult[0];
    console.log(`✅ Utilisateur trouvé: ${user.email} (${user.role})`);
    console.log(`📋 ID: ${user.id}`);
    console.log(`👤 Nom: ${user.name}`);
    
    // 2. Vérifier le mot de passe
    console.log('\n2️⃣ Vérification du mot de passe...');
    
    if (!user.password) {
      console.log('❌ Aucun mot de passe défini pour cet utilisateur !');
      console.log('💡 Cet utilisateur a probablement été créé via OAuth (Google)');
      return;
    }
    
    console.log(`🔐 Hash en base: ${user.password.substring(0, 20)}...`);
    
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Mot de passe correct !');
      console.log('\n🎉 L\'authentification devrait fonctionner');
      console.log('\n📋 Données retournées par NextAuth:');
      console.log(`  - id: ${user.id}`);
      console.log(`  - email: ${user.email}`);
      console.log(`  - name: ${user.name}`);
      console.log(`  - role: ${user.role}`);
    } else {
      console.log('❌ Mot de passe incorrect !');
      console.log('💡 Le hash ne correspond pas au mot de passe fourni');
      
      // Test avec d'autres mots de passe possibles
      console.log('\n🔄 Test avec d\'autres mots de passe courants...');
      const commonPasswords = ['password', 'admin', '123456', 'navette123', 'admin@123'];
      
      for (const pwd of commonPasswords) {
        const test = await bcrypt.compare(pwd, user.password);
        if (test) {
          console.log(`✅ Mot de passe trouvé: ${pwd}`);
          return;
        }
      }
      
      console.log('❌ Aucun mot de passe commun ne fonctionne');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAuthFlow();