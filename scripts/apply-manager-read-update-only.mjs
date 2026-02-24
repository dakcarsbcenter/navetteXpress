import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function applyReadUpdateOnly() {
  console.log('🔧 Application de la nouvelle politique Manager: READ et UPDATE uniquement\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Lire le fichier SQL
    const migrationPath = join(__dirname, '..', 'migrations', 'manager-read-update-only.sql');
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
      ORDER BY 
        CASE resource
          WHEN 'users' THEN 1
          WHEN 'vehicles' THEN 2
          WHEN 'bookings' THEN 3
          WHEN 'quotes' THEN 4
          WHEN 'reviews' THEN 5
        END,
        CASE action
          WHEN 'create' THEN 1
          WHEN 'read' THEN 2
          WHEN 'update' THEN 3
          WHEN 'delete' THEN 4
        END
    `);

    console.log('📊 Permissions Manager après application:\n');
    console.log('┌─────────────┬──────────┬──────────┬──────────┬──────────┐');
    console.log('│ Ressource   │ Create   │ Read     │ Update   │ Delete   │');
    console.log('├─────────────┼──────────┼──────────┼──────────┼──────────┤');

    const resources = ['users', 'vehicles', 'bookings', 'quotes', 'reviews'];
    const icons = {
      users: '👥',
      vehicles: '🚗',
      bookings: '📅',
      quotes: '📋',
      reviews: '⭐'
    };

    resources.forEach(resource => {
      const perms = result.rows.filter(r => r.resource === resource);
      const create = perms.find(p => p.action === 'create')?.allowed ? '✅ true ' : '❌ false';
      const read = perms.find(p => p.action === 'read')?.allowed ? '✅ true ' : '❌ false';
      const update = perms.find(p => p.action === 'update')?.allowed ? '✅ true ' : '❌ false';
      const del = perms.find(p => p.action === 'delete')?.allowed ? '✅ true ' : '❌ false';
      
      const icon = icons[resource] || '📦';
      const label = `${icon} ${resource.toUpperCase().padEnd(9)}`;
      console.log(`│ ${label} │ ${create} │ ${read} │ ${update} │ ${del} │`);
    });

    console.log('└─────────────┴──────────┴──────────┴──────────┴──────────┘\n');

    // Vérifier la conformité
    const expected = {
      users: { create: false, read: true, update: true, delete: false },
      vehicles: { create: false, read: true, update: true, delete: false },
      bookings: { create: false, read: true, update: true, delete: false },
      quotes: { create: false, read: true, update: true, delete: false },
      reviews: { create: false, read: true, update: true, delete: false },
    };

    let allCorrect = true;
    const errors = [];

    for (const row of result.rows) {
      if (expected[row.resource] && expected[row.resource][row.action] !== row.allowed) {
        allCorrect = false;
        errors.push(`❌ ${row.resource}.${row.action}: attendu=${expected[row.resource][row.action]}, actuel=${row.allowed}`);
      }
    }

    if (allCorrect) {
      console.log('✅ ✨ TOUTES les permissions Manager sont maintenant conformes!\n');
      console.log('📋 Nouvelle politique:');
      console.log('   ✅ Le Manager peut CONSULTER toutes les ressources');
      console.log('   ✅ Le Manager peut MODIFIER toutes les ressources');
      console.log('   ❌ Le Manager ne peut PAS CRÉER de nouvelles ressources');
      console.log('   ❌ Le Manager ne peut PAS SUPPRIMER de ressources\n');
    } else {
      console.log('\n❌ Erreurs détectées:\n');
      errors.forEach(err => console.log(err));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyReadUpdateOnly()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
