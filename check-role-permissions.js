const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

// Schema simple pour vérifier les permissions
const { pgTable, text, serial, boolean, timestamp } = require('drizzle-orm/pg-core');

const rolePermissionsTable = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleName: text('role_name'),
  resource: text('resource'),
  action: text('action'),
  allowed: boolean('allowed'),
  createdAt: timestamp('created_at'),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function checkRolePermissions() {
  try {
    console.log('🔍 Vérification des permissions des rôles...\n');
    
    // Récupérer toutes les permissions
    const allPermissions = await db.select().from(rolePermissionsTable).limit(20);
    
    console.log(`📊 Nombre total de permissions: ${allPermissions.length}\n`);
    
    if (allPermissions.length > 0) {
      console.log('📋 Permissions existantes:');
      
      const groupedByRole = {};
      allPermissions.forEach(perm => {
        if (!groupedByRole[perm.roleName]) {
          groupedByRole[perm.roleName] = [];
        }
        groupedByRole[perm.roleName].push(perm);
      });
      
      Object.entries(groupedByRole).forEach(([role, permissions]) => {
        console.log(`\n🎭 Rôle: ${role}`);
        permissions.forEach(perm => {
          const status = perm.allowed ? '✅' : '❌';
          console.log(`   ${status} ${perm.resource}.${perm.action} (ID: ${perm.id})`);
        });
      });
      
      // Vérifier les doublons
      console.log('\n🔍 Vérification des doublons...');
      const duplicates = {};
      allPermissions.forEach(perm => {
        const key = `${perm.roleName}_${perm.resource}_${perm.action}`;
        if (!duplicates[key]) {
          duplicates[key] = [];
        }
        duplicates[key].push(perm);
      });
      
      const hasDuplicates = Object.values(duplicates).some(group => group.length > 1);
      if (hasDuplicates) {
        console.log('⚠️  Doublons détectés:');
        Object.entries(duplicates).forEach(([key, perms]) => {
          if (perms.length > 1) {
            console.log(`   ${key}: ${perms.length} entrées (IDs: ${perms.map(p => p.id).join(', ')})`);
          }
        });
      } else {
        console.log('✅ Aucun doublon détecté');
      }
    } else {
      console.log('ℹ️  Aucune permission trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkRolePermissions();