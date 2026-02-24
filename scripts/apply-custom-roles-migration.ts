import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function applyCustomRolesMigration() {
  try {
    console.log('🚀 Application de la migration des rôles personnalisés...')
    
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'migrations', '0008_add_custom_roles_support.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')
    
    // Diviser le SQL en instructions individuelles
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📄 ${statements.length} instructions SQL trouvées`)
    
    // Exécuter chaque instruction
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Exécution de l'instruction ${i + 1}...`)
        try {
          await db.execute(sql.raw(statement))
          console.log(`✅ Instruction ${i + 1} réussie`)
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log(`⚠️ Instruction ${i + 1} ignorée (déjà existante)`)
          } else {
            console.error(`❌ Erreur instruction ${i + 1}:`, error.message)
            throw error
          }
        }
      }
    }
    
    // Vérifier que les tables ont été créées
    console.log('\n🔍 Vérification des tables créées...')
    
    const customRolesCount = await db.execute(sql`SELECT COUNT(*) as count FROM custom_roles`)
    const rolePermissionsCount = await db.execute(sql`SELECT COUNT(*) as count FROM role_permissions`)
    
    console.log(`📊 Rôles personnalisés: ${customRolesCount.rows[0].count}`)
    console.log(`📊 Permissions de rôles: ${rolePermissionsCount.rows[0].count}`)
    
    // Afficher les rôles créés
    const roles = await db.execute(sql`SELECT name, display_name, is_system FROM custom_roles ORDER BY is_system DESC, name`)
    console.log('\n🎭 Rôles disponibles:')
    for (const role of roles.rows) {
      const type = role.is_system ? '🔒 Système' : '🎨 Personnalisé'
      console.log(`  ${type}: ${role.name} (${role.display_name})`)
    }
    
    console.log('\n✅ Migration des rôles personnalisés terminée avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

// Exécuter la migration
applyCustomRolesMigration()
  .then(() => {
    console.log('🎉 Migration appliquée avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Échec de la migration:', error)
    process.exit(1)
  })