/**
 * Script pour corriger les permissions de suppression du rôle Manager
 * Conformément à PERMISSIONS_MATRIX_SUMMARY.md
 * 
 * Le Manager ne doit PAS pouvoir supprimer les utilisateurs
 */

import { sql } from 'drizzle-orm';
import { db } from '../src/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixManagerPermissions() {
  console.log('🔧 Correction des permissions Manager...\n');

  try {
    // Lire le fichier SQL
    const migrationPath = join(__dirname, '..', 'migrations', 'fix-manager-delete-permissions.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Exécuter la migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Migration exécutée avec succès!\n');

    // Afficher les permissions du manager
    console.log('📊 Permissions du rôle Manager:');
    console.log('━'.repeat(80));
    
    const managerPermissions = await db.execute(sql`
      SELECT 
        resource,
        action,
        allowed,
        description
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
    managerPermissions.rows.forEach(row => {
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

    Object.keys(byResource).forEach(resource => {
      const icon = resourceIcons[resource] || '📦';
      console.log(`\n${icon} ${resource.toUpperCase()}`);
      
      byResource[resource].forEach(perm => {
        const actionIcon = actionIcons[perm.action] || '•';
        const status = perm.allowed ? '✅' : '❌';
        console.log(`  ${actionIcon} ${perm.action.padEnd(10)} ${status} ${perm.description || ''}`);
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
