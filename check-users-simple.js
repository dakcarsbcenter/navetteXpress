const { neon } = require('@neondatabase/serverless');

async function checkUsers() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Vérification des utilisateurs...');
    
    const users = await sql`SELECT id, name, email, role FROM users ORDER BY role, name`;
    
    console.log(`📊 Total: ${users.length} utilisateurs`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Rôle: ${user.role}, Nom: ${user.name}`);
    });
    
    const drivers = users.filter(user => user.role === 'driver');
    console.log(`🚗 Chauffeurs (role='driver'): ${drivers.length}`);
    
    const chauffeurs = users.filter(user => user.role === 'chauffeur');
    console.log(`🚗 Chauffeurs (role='chauffeur'): ${chauffeurs.length}`);
    
    // Vérifier si l'utilisateur chauffeur-007 existe
    const chauffeur007 = users.find(user => user.id === 'chauffeur-007' || user.name.includes('chauffeur-007') || user.email.includes('chauffeur-007'));
    if (chauffeur007) {
      console.log(`🎯 Utilisateur chauffeur-007 trouvé:`, chauffeur007);
    } else {
      console.log(`❌ Utilisateur chauffeur-007 non trouvé`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkUsers().then(() => {
  console.log('✅ Vérification terminée');
  process.exit(0);
}).catch(console.error);