import { config } from 'dotenv'
import { db } from './src/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

// Charger les variables d'environnement
config({ path: '.env.local' })

async function applyMigration() {
  console.log('📝 Application de la migration...')
  
  try {
    const migrationPath = path.join(process.cwd(), 'migrations', '0009_add_reset_password.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Exécuter la migration
    await db.execute(sql.raw(migrationSQL))
    
    console.log('✅ Migration appliquée avec succès !')
    console.log('✅ Colonnes reset_token et reset_token_expiry ajoutées à la table users')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

applyMigration()
