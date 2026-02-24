import postgres from 'postgres'
import * as fs from 'fs'
import * as path from 'path'

// Utiliser l'URL depuis drizzle.config.ts
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

async function runMigration() {
  console.log('🚀 Début de la migration: Ajout de la table invoices')
  
  let sql: postgres.Sql<{}> | null = null
  
  try {
    // Connexion directe avec postgres.js
    sql = postgres(DATABASE_URL)
    
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'migrations', 'add-invoices-table.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8')
    
    console.log('📄 Lecture du fichier de migration...')
    
    // Exécuter la migration
    console.log('⚙️  Exécution de la migration...')
    await sql.unsafe(sqlContent)
    
    console.log('✅ Migration terminée avec succès!')
    console.log('\n📊 Résumé:')
    console.log('   ✓ Table "invoices" créée')
    console.log('   ✓ Enum "invoice_status" créé')
    console.log('   ✓ Index ajoutés pour les performances')
    console.log('   ✓ Trigger pour updated_at configuré')
    console.log('   ✓ Contraintes de vérification ajoutées')
    
    console.log('\n💡 Prochaines étapes:')
    console.log('   1. Les factures seront générées automatiquement lors de la validation des devis')
    console.log('   2. Format du numéro de facture: INV-YYYY-XXXXX')
    console.log('   3. TVA par défaut: 20%')
    console.log('   4. Date d\'échéance: 30 jours après l\'émission')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      if (error.message.includes('already exists')) {
        console.log('\n💡 Note: La table existe déjà, ce qui est normal si la migration a déjà été exécutée.')
      }
    }
    process.exit(1)
  } finally {
    // Fermer la connexion proprement
    if (sql) {
      await sql.end()
    }
  }
}

// Exécuter la migration
runMigration()
  .then(() => {
    console.log('\n✅ Script de migration terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
