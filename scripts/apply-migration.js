const { neon } = require('@neondatabase/serverless');

async function applyMigration() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔧 Application de la migration...');
    
    // 1. Mettre à jour les rôles existants
    console.log('📝 Mise à jour des rôles utilisateurs...');
    await sql`UPDATE users SET role = 'chauffeur' WHERE role = 'driver'`;
    await sql`UPDATE permissions SET role = 'chauffeur' WHERE role = 'driver'`;
    
    // 2. Vérifier les changements
    console.log('✅ Migration terminée');
    
    const users = await sql`SELECT role, COUNT(*) as count FROM users GROUP BY role`;
    console.log('👥 Rôles utilisateurs:', users);
    
    const permissions = await sql`SELECT role, COUNT(*) as count FROM permissions GROUP BY role`;
    console.log('🔐 Rôles permissions:', permissions);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

applyMigration().then(() => {
  console.log('✅ Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
