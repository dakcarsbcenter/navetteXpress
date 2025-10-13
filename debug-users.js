const { db } = require('./src/db');
const { users } = require('./src/schema');

async function checkUsersSimple() {
  try {
    console.log('🔍 Vérification des utilisateurs...');
    
    const allUsers = await db.select().from(users);
    
    console.log(`📊 Total: ${allUsers.length} utilisateurs`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Rôle: ${user.role}, Nom: ${user.name}`);
    });
    
    const drivers = allUsers.filter(user => user.role === 'driver');
    console.log(`🚗 Chauffeurs (role='driver'): ${drivers.length}`);
    
    const chauffeurs = allUsers.filter(user => user.role === 'chauffeur');
    console.log(`🚗 Chauffeurs (role='chauffeur'): ${chauffeurs.length}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

checkUsersSimple();