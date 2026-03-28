require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function addDriverPermissions() {
  try {
    console.log('🔧 Ajout des permissions manquantes au driver...');
    
    // Ajouter les permissions manquantes
    await sql`
      INSERT INTO role_permissions (role_name, resource, action, allowed) 
      VALUES 
        ('driver', 'vehicles', 'manage', true),
        ('driver', 'reports', 'read', true),
        ('driver', 'profile', 'manage', true)
      ON CONFLICT (role_name, resource, action) 
      DO UPDATE SET allowed = true
    `;
    
    console.log('✅ Permissions ajoutées au driver');
    
    // Vérifier les nouvelles permissions
    const driverPermissions = await sql`
      SELECT resource, action, allowed 
      FROM role_permissions 
      WHERE role_name = 'driver'
      ORDER BY resource, action
    `;
    
    console.log('\n📋 Permissions du driver:');
    driverPermissions.forEach(p => {
      console.log(`  - ${p.resource}.${p.action}: ${p.allowed ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

addDriverPermissions();