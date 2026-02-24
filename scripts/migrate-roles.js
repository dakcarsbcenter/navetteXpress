require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function migrateRoles() {
  console.log('🚀 Migration des rôles personnalisés...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL non définie dans les variables d\'environnement');
  }
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Créer la table custom_roles
    console.log('📝 Création de la table custom_roles...');
    await sql`
      CREATE TABLE IF NOT EXISTS custom_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6366f1',
        level INTEGER DEFAULT 1,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table custom_roles créée');
    
    // Créer la table role_permissions
    console.log('📝 Création de la table role_permissions...');
    await sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) REFERENCES custom_roles(name) ON DELETE CASCADE,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        allowed BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, resource, action)
      )
    `;
    console.log('✅ Table role_permissions créée');
    
    // Insérer les rôles système s'ils n'existent pas
    console.log('📝 Insertion des rôles système...');
    await sql`
      INSERT INTO custom_roles (name, display_name, description, color, level, is_system) VALUES
      ('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#dc2626', 5, true),
      ('driver', 'Chauffeur', 'Accès aux réservations et véhicules assignés', '#059669', 2, true),
      ('customer', 'Client', 'Accès aux réservations et demandes de devis', '#2563eb', 1, true),
      ('manager', 'Manager', 'Gestion des utilisateurs et vue sur les réservations', '#f59e0b', 3, false)
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Rôles système insérés');
    
    // Migrer les permissions existantes depuis la table legacy si elle existe
    console.log('📝 Migration des permissions existantes...');
    try {
      await sql`
        INSERT INTO role_permissions (role_name, resource, action, allowed)
        SELECT role::text, resource, action, allowed 
        FROM permissions
        ON CONFLICT (role_name, resource, action) DO NOTHING
      `;
      console.log('✅ Permissions migrées depuis la table legacy');
    } catch (error) {
      console.log('ℹ️ Table permissions legacy non trouvée, création des permissions par défaut');
      
      // Créer des permissions par défaut
      console.log('📝 Création des permissions par défaut...');
      
      // Admin - accès complet
      const adminPermissions = [
        ['admin', 'users', 'manage'],
        ['admin', 'users', 'read'],
        ['admin', 'vehicles', 'manage'],
        ['admin', 'vehicles', 'read'],
        ['admin', 'bookings', 'manage'],
        ['admin', 'bookings', 'read'],
        ['admin', 'quotes', 'manage'],
        ['admin', 'quotes', 'read'],
      ];
      
      // Manager - gestion limitée
      const managerPermissions = [
        ['manager', 'users', 'read'],
        ['manager', 'bookings', 'read'],
        ['manager', 'quotes', 'read'],
      ];
      
      // Driver - lecture des réservations
      const driverPermissions = [
        ['driver', 'bookings', 'read'],
        ['driver', 'vehicles', 'read'],
      ];
      
      // Customer - lecture des réservations personnelles
      const customerPermissions = [
        ['customer', 'bookings', 'read'],
        ['customer', 'quotes', 'read'],
      ];
      
      const allPermissions = [...adminPermissions, ...managerPermissions, ...driverPermissions, ...customerPermissions];
      
      for (const [role, resource, action] of allPermissions) {
        await sql`
          INSERT INTO role_permissions (role_name, resource, action, allowed) 
          VALUES (${role}, ${resource}, ${action}, true)
          ON CONFLICT (role_name, resource, action) DO NOTHING
        `;
      }
      console.log('✅ Permissions par défaut créées');
    }
    
    // Vérifier les résultats
    console.log('📊 Vérification des résultats...');
    const roles = await sql`SELECT name, display_name, is_system FROM custom_roles ORDER BY is_system DESC, name`;
    const permissions = await sql`SELECT COUNT(*) as count FROM role_permissions`;
    
    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Rôles créés:');
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.display_name}) ${role.is_system ? '[Système]' : '[Personnalisé]'}`);
    });
    console.log(`🔐 Total permissions: ${permissions[0].count}`);
    
    return {
      success: true,
      roles: roles.length,
      permissions: permissions[0].count
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    throw error;
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateRoles };