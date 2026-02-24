const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq, and } = require('drizzle-orm');
require('dotenv').config({ path: '.env.local' });

// Schema pour ajouter une permission
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

async function addVehiclePermissionToCustomer() {
  try {
    console.log('🚗 Ajout de la permission vehicles.manage au rôle customer...\n');
    
    // Vérifier si la permission existe déjà
    const existing = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, 'customer'),
        eq(rolePermissionsTable.resource, 'vehicles'),
        eq(rolePermissionsTable.action, 'manage')
      ));
    
    if (existing.length > 0) {
      console.log('ℹ️  La permission existe déjà !');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Autorisée: ${existing[0].allowed}`);
      
      if (!existing[0].allowed) {
        console.log('🔄 Activation de la permission...');
        await db
          .update(rolePermissionsTable)
          .set({ allowed: true })
          .where(eq(rolePermissionsTable.id, existing[0].id));
        console.log('✅ Permission activée !');
      }
    } else {
      console.log('➕ Création de la nouvelle permission...');
      const result = await db
        .insert(rolePermissionsTable)
        .values({
          roleName: 'customer',
          resource: 'vehicles',
          action: 'manage',
          allowed: true
        })
        .returning();
      
      console.log('✅ Permission créée avec succès !');
      console.log(`   ID: ${result[0].id}`);
    }
    
    // Vérifier le résultat
    console.log('\n🔍 Vérification des permissions customer...');
    const customerPermissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleName, 'customer'));
    
    console.log(`📊 Total permissions customer: ${customerPermissions.length}`);
    customerPermissions.forEach(perm => {
      const status = perm.allowed ? '✅' : '❌';
      console.log(`   ${status} ${perm.resource}.${perm.action} (ID: ${perm.id})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.constraint) {
      console.log('💡 Indice: Il y a probablement un conflit de contrainte unique');
    }
  }
}

addVehiclePermissionToCustomer();