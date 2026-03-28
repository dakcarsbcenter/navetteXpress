require('dotenv').config({ path: '.env.local' });
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { pgTable, text, serial, boolean, timestamp, uuid } = require('drizzle-orm/pg-core');
const { eq, and } = require('drizzle-orm');

// Schéma simplifié
const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  role: text('role'),
});

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

async function testPermissions() {
  try {
    console.log('🔍 Test de la logique de permissions...\n');
    
    // 1. Récupérer un utilisateur admin
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (!adminUsers.length) {
      console.log('❌ Aucun utilisateur admin trouvé!');
      return;
    }
    
    const adminUser = adminUsers[0];
    console.log(`✅ Utilisateur admin trouvé:`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Rôle: ${adminUser.role}\n`);
    
    // 2. Tester la logique de permission
    const resource = 'bookings';
    const action = 'read';
    
    console.log(`🔍 Test: permission '${action}' sur '${resource}'`);
    
    // Vérifier si l'utilisateur est admin (devrait toujours avoir accès)
    if (adminUser.role === 'admin') {
      console.log('✅ L\'utilisateur est admin - accès AUTORISÉ (court-circuit)\n');
    }
    
    // 3. Vérifier les permissions dans la table (par précaution)
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, adminUser.role),
        eq(rolePermissionsTable.resource, resource),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ));
    
    console.log(`📋 Permissions trouvées dans la table: ${permissions.length}`);
    if (permissions.length > 0) {
      permissions.forEach(perm => {
        console.log(`   ✅ ${perm.roleName}.${perm.resource}.${perm.action} = ${perm.allowed}`);
      });
    }
    
    console.log('\n🎯 Résultat final:');
    console.log(`   ${adminUser.role === 'admin' || permissions.length > 0 ? '✅ ACCÈS AUTORISÉ' : '❌ ACCÈS REFUSÉ'}`);
    
    // 4. Tester pour un manager
    console.log('\n---\n');
    const managerUsers = await db.select().from(users).where(eq(users.role, 'manager')).limit(1);
    
    if (managerUsers.length > 0) {
      const managerUser = managerUsers[0];
      console.log(`📋 Utilisateur manager trouvé:`);
      console.log(`   ID: ${managerUser.id}`);
      console.log(`   Email: ${managerUser.email}`);
      console.log(`   Rôle: ${managerUser.role}\n`);
      
      console.log(`🔍 Test: permission '${action}' sur '${resource}' pour manager`);
      
      if (managerUser.role === 'admin') {
        console.log('✅ L\'utilisateur est admin - accès AUTORISÉ\n');
      } else {
        console.log('⚠️  L\'utilisateur n\'est PAS admin - vérification des permissions...\n');
        
        const managerPermissions = await db
          .select()
          .from(rolePermissionsTable)
          .where(and(
            eq(rolePermissionsTable.roleName, managerUser.role),
            eq(rolePermissionsTable.resource, resource),
            eq(rolePermissionsTable.action, action),
            eq(rolePermissionsTable.allowed, true)
          ));
        
        console.log(`📋 Permissions trouvées: ${managerPermissions.length}`);
        if (managerPermissions.length > 0) {
          managerPermissions.forEach(perm => {
            console.log(`   ✅ ${perm.roleName}.${perm.resource}.${perm.action} = ${perm.allowed}`);
          });
        }
        
        console.log('\n🎯 Résultat final:');
        console.log(`   ${managerPermissions.length > 0 ? '✅ ACCÈS AUTORISÉ' : '❌ ACCÈS REFUSÉ'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testPermissions().then(() => {
  console.log('\n✅ Test terminé');
  process.exit(0);
}).catch(console.error);
