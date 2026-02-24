import { db } from './src/db.ts'
import { sql } from 'drizzle-orm'

async function addResetPasswordColumns() {
  console.log('📝 Ajout des colonnes reset_token et reset_token_expiry...')
  
  try {
    // Ajouter les colonnes
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `)
    
    console.log('✅ Colonnes ajoutées avec succès')
    
    // Créer un index pour améliorer les performances
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)
    `)
    
    console.log('✅ Index créé avec succès')
    
    console.log('🎉 Migration terminée !')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

addResetPasswordColumns()
