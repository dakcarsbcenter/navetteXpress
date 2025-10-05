const { db } = require('../src/db.ts');
const { users } = require('../src/schema.ts');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { eq } = require('drizzle-orm');

async function createAdmin() {
  console.log('🚀 Création de l\'utilisateur admin...');

  const adminEmail = 'admin@navettexpress.com';
  const adminPassword = 'admin123';
  const adminName = 'Administrateur Navette Xpress';

  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('⚠️  L\'utilisateur admin existe déjà');
      return;
    }

    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminId = randomUUID();

    const newAdmin = await db
      .insert(users)
      .values({
        id: adminId,
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '+33123456789',
        licenseNumber: 'ADMIN001', // Numéro de permis spécial pour l'admin
        isActive: true,
        emailVerified: new Date(),
      })
      .returning();

    console.log('✅ Utilisateur admin créé avec succès !');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
    console.log(`🆔 ID: ${adminId}`);
    console.log('⚠️  Changez le mot de passe après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  createAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createAdmin };
