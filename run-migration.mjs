import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté avec succès\n');

    // Lire le fichier SQL
    const sqlPath = join(__dirname, 'add-booking-price-approval.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Exécution de la migration SQL...\n');
    console.log('SQL à exécuter:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60) + '\n');

    // Exécuter le SQL
    await client.query(sql);

    console.log('✅ Migration exécutée avec succès!\n');

    // Vérifier les colonnes ajoutées
    console.log('🔍 Vérification des colonnes ajoutées...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      AND column_name IN ('price_proposed_at', 'client_response', 'client_response_at', 'client_response_message')
      ORDER BY column_name;
    `);

    if (result.rows.length > 0) {
      console.log('\n📊 Colonnes créées:');
      console.table(result.rows);
    } else {
      console.log('⚠️ Aucune colonne trouvée (peut-être déjà existantes)');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Déconnecté de la base de données');
  }
}

runMigration();
