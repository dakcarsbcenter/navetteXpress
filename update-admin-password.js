const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Schema pour mettre à jour l'utilisateur
const { pgTable, text } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  password: text('password'),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function updateAdminPassword() {
  try {
    const adminEmail = 'admin@navettehub.com';
    const newPassword = 'admin123';
    
    console.log(`🔄 Mise à jour du mot de passe pour ${adminEmail}...`);
    
    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Mise à jour en base
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, adminEmail))
      .returning();
    
    if (result.length > 0) {
      console.log('✅ Mot de passe mis à jour avec succès !');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Nouveau mot de passe: ${newPassword}`);
      console.log('\n🎯 Vous pouvez maintenant vous connecter avec ces identifiants.');
    } else {
      console.log(`❌ Aucun utilisateur trouvé avec l'email ${adminEmail}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
  }
}

updateAdminPassword();