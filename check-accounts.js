const { Client } = require('pg');

// Base source (Neon)
const sourceUrl = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

async function checkAccounts() {
  const sourceClient = new Client({ connectionString: sourceUrl });

  try {
    console.log('🔌 Connexion à la base source...');
    await sourceClient.connect();
    console.log('✅ Connecté\n');

    // Vérifier si la table existe
    const checkTable = await sourceClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('❌ La table accounts n\'existe pas dans la base source');
      return;
    }

    console.log('✅ La table accounts existe dans la base source\n');

    // Compter les lignes
    const count = await sourceClient.query('SELECT COUNT(*) FROM accounts');
    console.log(`📊 Nombre de lignes dans accounts: ${count.rows[0].count}\n`);

    if (count.rows[0].count > 0) {
      // Afficher quelques exemples
      const sample = await sourceClient.query('SELECT * FROM accounts LIMIT 5');
      console.log('📋 Exemples de données:');
      console.table(sample.rows);
    } else {
      console.log('ℹ️  La table accounts est vide dans la base source aussi');
    }

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await sourceClient.end();
    console.log('\n🔌 Connexion fermée');
  }
}

checkAccounts();
