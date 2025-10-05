const { db } = require('../src/db');
const { users } = require('../src/schema');
const { eq, isNull } = require('drizzle-orm');

async function updateExistingUsers() {
  console.log('🔄 Mise à jour des utilisateurs existants...');

  try {
    // Récupérer tous les utilisateurs sans numéro de permis
    const usersWithoutLicense = await db
      .select()
      .from(users)
      .where(isNull(users.licenseNumber));

    console.log(`📊 ${usersWithoutLicense.length} utilisateurs trouvés sans numéro de permis`);

    // Mettre à jour chaque utilisateur
    for (let i = 0; i < usersWithoutLicense.length; i++) {
      const user = usersWithoutLicense[i];
      const licenseNumber = `TEMP${String(i + 1).padStart(3, '0')}`;
      
      await db
        .update(users)
        .set({ 
          licenseNumber: licenseNumber,
          // Mettre à jour le rôle si nécessaire
          role: user.role || 'chauffeur'
        })
        .where(eq(users.id, user.id));

      console.log(`✅ Utilisateur ${user.email} mis à jour avec le permis ${licenseNumber}`);
    }

    console.log('🎉 Mise à jour terminée avec succès !');
    console.log('⚠️  N\'oubliez pas de mettre à jour les numéros de permis avec de vraies valeurs !');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  updateExistingUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { updateExistingUsers };
