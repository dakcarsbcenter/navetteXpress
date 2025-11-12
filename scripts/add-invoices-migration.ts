import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('🚀 Début de la migration: Ajout de la table invoices')
  
  try {
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'migrations', 'add-invoices-table.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8')
    
    console.log('📄 Lecture du fichier de migration...')
    
    // Exécuter la migration
    console.log('⚙️  Exécution de la migration...')
    await db.execute(sql.raw(sqlContent))
    
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
    console.error('Stack:', error instanceof Error ? error.stack : 'Pas de stack trace')
    process.exit(1)
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
