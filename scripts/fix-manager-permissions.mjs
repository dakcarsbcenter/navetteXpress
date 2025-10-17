/**
 * Script pour corriger les permissions de suppression du rôle Manager
 * Conformément à PERMISSIONS_MATRIX_SUMMARY.md
 * 
 * Le Manager ne doit PAS pouvoir supprimer les utilisateurs
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function fixManagerPermissions() {
  console.log('🔧 Correction des permissions Manager...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Lire le fichier SQL
    const migrationPath = join(__dirname, '..', 'migrations', 'fix-manager-delete-permissions.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Séparer les commandes SQL
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    // Exécuter chaque commande
    for (const command of commands) {
      if (command.toLowerCase().startsWith('select')) {
        // Pour les SELECT, afficher les résultats
        const result = await pool.query(command);
        console.log('\n📊 Permissions du rôle Manager:');
        console.log('━'.repeat(80));
        console.table(result.rows);
      } else {
        // Pour les autres commandes, juste les exécuter
        await pool.query(command);
      }
    }

    console.log('\n✅ Migration exécutée avec succès!\n');

    // Afficher les permissions du manager de manière formatée
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
        action
    `);

    // Grouper par ressource
    const byResource = {};
    result.rows.forEach(row => {
      if (!byResource[row.resource]) {
        byResource[row.resource] = [];
      }
      byResource[row.resource].push(row);
    });

    // Afficher de manière formatée
    const resourceIcons = {
      users: '👥',
      vehicles: '🚗',
      bookings: '📅',
      quotes: '📋',
      reviews: '⭐'
    };

    const actionIcons = {
      create: '➕',
      read: '👁️',
      update: '✏️',
      delete: '🗑️'
    };

    console.log('📊 Résumé des permissions Manager:');
    console.log('━'.repeat(80));

    Object.keys(byResource).forEach(resource => {
      const icon = resourceIcons[resource] || '📦';
      console.log(`\n${icon} ${resource.toUpperCase()}`);
      
      byResource[resource].forEach(perm => {
        const actionIcon = actionIcons[perm.action] || '•';
        const status = perm.allowed ? '✅' : '❌';
        console.log(`  ${actionIcon} ${perm.action.padEnd(10)} ${status}`);
      });
    });

    console.log('\n' + '━'.repeat(80));
    console.log('\n✨ Résumé de la correction:');
    console.log('   • Manager peut LIRE les utilisateurs ✅');
    console.log('   • Manager ne peut PAS créer, modifier ou supprimer les utilisateurs ❌');
    console.log('   • Manager garde tous les droits sur: Vehicles, Bookings, Quotes, Reviews ✅\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixManagerPermissions()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
