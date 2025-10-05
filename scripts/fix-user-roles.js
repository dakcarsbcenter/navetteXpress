const { db } = require('../src/db');
const { users } = require('../src/schema');
const { eq } = require('drizzle-orm');

async function fixUserRoles() {
  console.log('🔧 Correction des rôles utilisateurs...');
  
  try {
    // Mettre à jour tous les utilisateurs avec le rôle 'driver' vers 'chauffeur'
    const result = await db
      .update(users)
      .set({ role: 'chauffeur' })
      .where(eq(users.role, 'driver'))
      .returning();

    console.log(`✅ ${result.length} utilisateurs mis à jour de 'driver' vers 'chauffeur'`);
    
    // Vérifier les rôles actuels
    const allUsers = await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
    console.log('👥 Rôles actuels:');
    allUsers.forEach(user => {
      console.log(`  - ${user.name}: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction des rôles:', error);
  }
}

fixUserRoles().then(() => {
  console.log('✅ Correction terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
