import { db } from './src/db.js';
import { rolePermissionsTable } from './src/schema.js';
import { eq, and } from 'drizzle-orm';

async function addProfilePermissions() {
  try {
    console.log('🔄 Ajout des permissions de profil...');

    const permissions = [
      // Customer permissions
      { roleName: 'customer', resource: 'profile', action: 'read', allowed: true, description: 'Permission de lire son propre profil' },
      { roleName: 'customer', resource: 'profile', action: 'update', allowed: true, description: 'Permission de modifier son propre profil (nom, email, téléphone, photo)' },
      
      // Manager permissions
      { roleName: 'manager', resource: 'profile', action: 'read', allowed: true, description: 'Permission de lire son propre profil' },
      { roleName: 'manager', resource: 'profile', action: 'update', allowed: true, description: 'Permission de modifier son propre profil' },
      
      // Driver permissions
      { roleName: 'driver', resource: 'profile', action: 'read', allowed: true, description: 'Permission de lire son propre profil' },
      { roleName: 'driver', resource: 'profile', action: 'update', allowed: true, description: 'Permission de modifier son propre profil' },
    ];

    for (const perm of permissions) {
      // Vérifier si la permission existe déjà
      const existing = await db
        .select()
        .from(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, perm.roleName),
          eq(rolePermissionsTable.resource, perm.resource),
          eq(rolePermissionsTable.action, perm.action)
        ))
        .limit(1);

      if (existing.length === 0) {
        // Créer la permission
        await db.insert(rolePermissionsTable).values(perm);
        console.log(`✅ Permission créée: ${perm.roleName} - ${perm.action} ${perm.resource}`);
      } else {
        // Mettre à jour la permission
        await db
          .update(rolePermissionsTable)
          .set({ allowed: perm.allowed, description: perm.description })
          .where(and(
            eq(rolePermissionsTable.roleName, perm.roleName),
            eq(rolePermissionsTable.resource, perm.resource),
            eq(rolePermissionsTable.action, perm.action)
          ));
        console.log(`🔄 Permission mise à jour: ${perm.roleName} - ${perm.action} ${perm.resource}`);
      }
    }

    // Afficher toutes les permissions de profil
    const allProfilePermissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.resource, 'profile'));

    console.log('\n📋 Permissions de profil actuelles:');
    console.table(allProfilePermissions.map(p => ({
      Rôle: p.roleName,
      Action: p.action,
      Autorisé: p.allowed ? '✅' : '❌',
      Description: p.description
    })));

    console.log('\n✅ Permissions de profil ajoutées avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des permissions:', error);
    process.exit(1);
  }
}

addProfilePermissions();
