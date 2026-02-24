import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function applyCompleteFix() {
  console.log('🔧 Application de la correction COMPLÈTE des permissions Manager...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Lire le fichier SQL
    const migrationPath = join(__dirname, '..', 'migrations', 'fix-manager-permissions-complete.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Séparer et exécuter les commandes
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd.length > 5);

    for (const command of commands) {
      await pool.query(command);
    }

    console.log('✅ Migration exécutée avec succès!\n');

    // Afficher les permissions finales
    const result = await pool.query(`
      SELECT 
        resource,
        action,
        allowed
      FROM role_permissions
      WHERE role_name = 'manager'
      ORDER BY resource, action
    `);

    console.log('📊 Permissions Manager après correction:');
    console.log('━'.repeat(80));
    console.table(result.rows);

    // Vérifier la conformité
    const expected = {
      users: { create: false, read: true, update: false, delete: false },
      vehicles: { create: true, read: true, update: true, delete: true },
      bookings: { create: true, read: true, update: true, delete: true },
      quotes: { create: true, read: true, update: true, delete: true },
      reviews: { create: true, read: true, update: true, delete: true },
    };

    let allCorrect = true;
    for (const row of result.rows) {
      if (expected[row.resource] && expected[row.resource][row.action] !== row.allowed) {
        allCorrect = false;
        console.error(`❌ Erreur: ${row.resource}.${row.action} devrait être ${expected[row.resource][row.action]} mais est ${row.allowed}`);
      }
    }

    if (allCorrect) {
      console.log('\n✅ ✨ TOUTES les permissions Manager sont maintenant CONFORMES à la matrice!\n');
      console.log('📋 Résumé:');
      console.log('   👥 USERS:      Lecture seule (read uniquement)');
      console.log('   🚗 VEHICLES:   Gérer (create, read, update, delete)');
      console.log('   📅 BOOKINGS:   Gérer (create, read, update, delete)');
      console.log('   📋 QUOTES:     Gérer (create, read, update, delete)');
      console.log('   ⭐ REVIEWS:    Gérer (create, read, update, delete)\n');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyCompleteFix()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
