#!/usr/bin/env node

/**
 * Script de migration pour ajouter les colonnes passengers, luggage et duration
 * à la table bookings
 * 
 * Usage: node apply-passengers-luggage-migration.js
 */

import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Début de la migration: ajout des colonnes passengers, luggage et duration\n');

    // Lire le fichier SQL de migration
    const migrationPath = path.join(__dirname, 'migrations', 'add-passengers-luggage-duration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Diviser le fichier en statements individuels
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 ${statements.length} instructions SQL à exécuter\n`);

    // Exécuter chaque statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Ignorer les commentaires et les blocs DO
      if (statement.startsWith('COMMENT') || statement.startsWith('DO $$')) {
        console.log(`⏭️  Instruction ${i + 1}: ${statement.substring(0, 60)}...`);
        try {
          await sql.query(statement + ';');
          console.log('   ✅ Exécuté\n');
        } catch (error) {
          console.log(`   ⚠️  Ignoré (peut-être déjà exécuté): ${error.message}\n`);
        }
        continue;
      }

      console.log(`🔄 Instruction ${i + 1}: ${statement.substring(0, 60)}...`);
      
      try {
        await sql.query(statement + ';');
        console.log('   ✅ Exécuté avec succès\n');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('   ⚠️  Déjà existant, ignoré\n');
        } else {
          console.error(`   ❌ Erreur: ${error.message}\n`);
          throw error;
        }
      }
    }

    // Vérifier le résultat
    console.log('🔍 Vérification des colonnes ajoutées...\n');
    
    const result = await sql.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
        AND column_name IN ('passengers', 'luggage', 'duration')
      ORDER BY column_name;
    `);

    if (result.rows.length === 3) {
      console.log('✅ Toutes les colonnes ont été ajoutées avec succès:\n');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'}, nullable: ${row.is_nullable})`);
      });
    } else {
      console.log(`⚠️  Seulement ${result.rows.length}/3 colonnes trouvées`);
    }

    // Afficher quelques statistiques
    console.log('\n📊 Statistiques des réservations:\n');
    
    const stats = await sql.query(`
      SELECT 
        COUNT(*) as total_bookings,
        ROUND(AVG(passengers), 2) as avg_passengers,
        MAX(passengers) as max_passengers,
        ROUND(AVG(luggage), 2) as avg_luggage,
        MAX(luggage) as max_luggage,
        ROUND(AVG(duration), 2) as avg_duration
      FROM bookings;
    `);

    if (stats.rows.length > 0) {
      const s = stats.rows[0];
      console.log(`   Total réservations: ${s.total_bookings}`);
      console.log(`   Passagers moyen: ${s.avg_passengers} (max: ${s.max_passengers})`);
      console.log(`   Valises moyen: ${s.avg_luggage} (max: ${s.max_luggage})`);
      console.log(`   Durée moyenne: ${s.avg_duration}h`);
    }

    console.log('\n✅ Migration terminée avec succès! 🎉\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter la migration
runMigration();
