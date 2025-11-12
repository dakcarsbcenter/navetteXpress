import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql as drizzleSql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Charger .env.local
dotenv.config({ path: '.env.local' })

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration...')
    
    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql)
    
    console.log('✅ Connecté à la base de données')
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'migrations', 'create-driver-availability.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Fichier de migration chargé')
    
    // Nettoyer et séparer les commandes SQL
    const lines = migrationSQL.split('\n')
    const cleanedSQL = lines
      .filter(line => !line.trim().startsWith('--') || line.trim().length === 0)
      .join('\n')
    
    const commands = cleanedSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
    
    console.log(`⚙️ Exécution de ${commands.length} commande(s) SQL...`)
    
    // Exécuter chaque commande séparément
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.length > 0) {
        const preview = command.substring(0, 60).replace(/\s+/g, ' ')
        console.log(`  [${i + 1}/${commands.length}] ${preview}...`)
        try {
          await db.execute(drizzleSql.raw(command))
          console.log(`  ✓ Commande ${i + 1} réussie`)
        } catch (error) {
          console.error(`  ✗ Erreur commande ${i + 1}:`, error.message)
          throw error
        }
      }
    }
    
    console.log('✅ Migration exécutée avec succès!')
    
    // Vérifier la création
    console.log('🔍 Vérification de la table...')
    const result = await db.execute(drizzleSql.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'driver_availability'
      ORDER BY ordinal_position
    `))
    
    console.log('📊 Colonnes créées:')
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })
    
    // Vérifier les données initiales
    console.log('\n📋 Données initiales:')
    const data = await db.execute(drizzleSql.raw('SELECT * FROM driver_availability'))
    console.log(`  ${data.rows.length} disponibilité(s) créée(s)`)
    
    if (data.rows.length > 0) {
      console.log('\n  Exemple:')
      console.log(`    Driver ID: ${data.rows[0].driver_id}`)
      console.log(`    Jour: ${data.rows[0].day_of_week} (0=Dim, 6=Sam)`)
      console.log(`    Horaires: ${data.rows[0].start_time} - ${data.rows[0].end_time}`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    console.error('Détails:', error.message)
    process.exit(1)
  }
}

runMigration()
