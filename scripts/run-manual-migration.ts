import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function runManualMigration() {
  try {
    console.log('🚀 Démarrage de la migration manuelle des rôles...')
    
    // Étape 1: Créer la table custom_roles
    console.log('📊 Création de la table custom_roles...')
    await db.execute(sql`
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
    `)
    console.log('✅ Table custom_roles créée')

    // Étape 2: Créer la table role_permissions
    console.log('📊 Création de la table role_permissions...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        allowed BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, resource, action)
      )
    `)
    console.log('✅ Table role_permissions créée')

    // Étape 3: Insérer les rôles système
    console.log('👑 Insertion des rôles système...')
    await db.execute(sql`
      INSERT INTO custom_roles (name, display_name, description, color, level, is_system) VALUES
      ('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#dc2626', 5, true),
      ('driver', 'Chauffeur', 'Accès aux réservations et véhicules assignés', '#059669', 2, true),
      ('customer', 'Client', 'Accès aux réservations et demandes de devis', '#2563eb', 1, true)
      ON CONFLICT (name) DO NOTHING
    `)
    console.log('✅ Rôles système insérés')

    // Étape 4: Migrer les permissions existantes
    console.log('🔑 Migration des permissions existantes...')
    await db.execute(sql`
      INSERT INTO role_permissions (role_name, resource, action, allowed)
      SELECT role::text, resource, action, allowed 
      FROM permissions
      ON CONFLICT (role_name, resource, action) DO NOTHING
    `)
    console.log('✅ Permissions migrées')

    // Vérification
    console.log('\n🔍 Vérification des résultats...')
    const rolesCount = await db.execute(sql`SELECT COUNT(*) as count FROM custom_roles`)
    const permissionsCount = await db.execute(sql`SELECT COUNT(*) as count FROM role_permissions`)
    
    console.log(`📊 Rôles créés: ${rolesCount.rows[0].count}`)
    console.log(`📊 Permissions migrées: ${permissionsCount.rows[0].count}`)

    // Afficher les rôles
    const roles = await db.execute(sql`SELECT name, display_name, is_system FROM custom_roles ORDER BY is_system DESC`)
    console.log('\n🎭 Rôles disponibles:')
    for (const role of roles.rows) {
      const type = role.is_system ? '🔒 Système' : '🎨 Personnalisé'
      console.log(`  ${type}: ${role.name} (${role.display_name})`)
    }

    console.log('\n🎉 Migration terminée avec succès!')
    return true

  } catch (error: any) {
    console.error('❌ Erreur lors de la migration:', error.message)
    
    // Détails supplémentaires pour le débogage
    if (error.message.includes('DATABASE_URL')) {
      console.error('💡 Solution: Vérifiez que DATABASE_URL est défini dans .env.local')
    }
    
    return false
  }
}

// Exporter pour utilisation dans d'autres scripts
export { runManualMigration }

// Exécuter si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runManualMigration()
    .then((success) => {
      if (success) {
        console.log('✅ Migration réussie!')
        process.exit(0)
      } else {
        console.log('❌ Migration échouée!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Erreur critique:', error)
      process.exit(1)
    })
}