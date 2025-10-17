import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function verifyAllRoles() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 VÉRIFICATION COMPLÈTE DES PERMISSIONS PAR RÔLE\n');
    console.log('=' .repeat(90));

    const roles = ['admin', 'manager', 'customer', 'driver'];
    const resources = ['users', 'vehicles', 'bookings', 'quotes', 'reviews'];
    const actions = ['create', 'read', 'update', 'delete'];

    for (const role of roles) {
      console.log(`\n📋 RÔLE: ${role.toUpperCase()}`);
      console.log('-'.repeat(90));

      const result = await pool.query(`
        SELECT resource, action, allowed
        FROM role_permissions
        WHERE role_name = $1
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
      `, [role]);

      // Organiser par ressource
      const byResource = {};
      result.rows.forEach(row => {
        if (!byResource[row.resource]) {
          byResource[row.resource] = {};
        }
        byResource[row.resource][row.action] = row.allowed;
      });

      // Afficher chaque ressource
      const icons = {
        users: '👥',
        vehicles: '🚗',
        bookings: '📅',
        quotes: '📋',
        reviews: '⭐'
      };

      for (const resource of resources) {
        const perms = byResource[resource] || {};
        const icon = icons[resource] || '📦';
        
        const status = actions.map(action => {
          const allowed = perms[action];
          if (allowed === true) return `${action}=✅`;
          if (allowed === false) return `${action}=❌`;
          return `${action}=⚪`;
        }).join('  ');

        console.log(`  ${icon} ${resource.padEnd(10)}  ${status}`);
      }
    }

    console.log('\n' + '='.repeat(90));
    console.log('\n✅ Vérification terminée\n');

    // Vérification spécifique Manager
    console.log('🎯 VÉRIFICATION SPÉCIFIQUE - MANAGER vs MATRICE');
    console.log('-'.repeat(90));

    const expected = {
      users: { create: false, read: true, update: false, delete: false },
      vehicles: { create: true, read: true, update: true, delete: true },
      bookings: { create: true, read: true, update: true, delete: true },
      quotes: { create: true, read: true, update: true, delete: true },
      reviews: { create: true, read: true, update: true, delete: true },
    };

    const managerPerms = await pool.query(`
      SELECT resource, action, allowed
      FROM role_permissions
      WHERE role_name = 'manager'
    `);

    let allCorrect = true;
    const errors = [];

    managerPerms.rows.forEach(row => {
      const exp = expected[row.resource]?.[row.action];
      if (exp !== undefined && exp !== row.allowed) {
        allCorrect = false;
        errors.push(`  ❌ ${row.resource}.${row.action}: attendu=${exp}, actuel=${row.allowed}`);
      }
    });

    if (allCorrect) {
      console.log('\n✅ ✨ TOUTES les permissions Manager sont CONFORMES à la matrice!\n');
      console.log('  👥 USERS:      Lecture seule');
      console.log('  🚗 VEHICLES:   Gestion complète');
      console.log('  📅 BOOKINGS:   Gestion complète');
      console.log('  📋 QUOTES:     Gestion complète');
      console.log('  ⭐ REVIEWS:    Gestion complète\n');
    } else {
      console.log('\n❌ Erreurs détectées:\n');
      errors.forEach(err => console.log(err));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

verifyAllRoles();
