const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function runMigration() {
  console.log('🔄 Lecture du fichier de migration...')
  
  const sqlPath = path.join(__dirname, '..', 'migrations', 'restructure-permissions-clean.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  
  console.log('📝 Exécution de la migration...')
  console.log('⚠️  Cette migration va effacer toutes les permissions existantes et les recréer.')
  console.log('')
  
  // Créer une connexion PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })
  
  try {
    // Exécuter le SQL
    await pool.query(sql)
    
    console.log('✅ Migration exécutée avec succès!')
    console.log('')
    console.log('📊 Permissions créées:')
    console.log('  - 4 actions par ressource (create, read, update, delete)')
    console.log('  - 5 ressources (users, vehicles, bookings, quotes, reviews)')
    console.log('  - 4 rôles (admin, manager, customer, driver)')
    console.log('  - Total: 4 rôles × 5 ressources × 4 actions = 80 permissions')
    console.log('')
    console.log('🔐 Permissions par défaut:')
    console.log('  - Admin: ⚡ Gérer sur toutes les ressources')
    console.log('  - Manager: ⚡ Gérer sur vehicles, bookings, quotes, reviews + ⚡ Gérer users')
    console.log('  - Customer: 👁️ Lire sur bookings, quotes, reviews')
    console.log('  - Driver: 👁️ Lire sur vehicles, bookings, reviews + ✏️ Modifier bookings')
    console.log('')
    console.log('🎉 Vous pouvez maintenant accéder à la matrice dans Admin Dashboard → Permissions')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    console.error(error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
  
  process.exit(0)
}

runMigration()
