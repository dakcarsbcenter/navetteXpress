import postgres from 'postgres';

const neonDb = postgres('postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require', {
  ssl: 'require',
  max: 1
});

async function checkInvoicesTable() {
  console.log('🔍 Vérification de la table invoices dans Neon...\n');

  try {
    // Vérifier si la table existe
    const [exists] = await neonDb`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices'
      )
    `;

    if (!exists.exists) {
      console.log('❌ La table invoices n\'existe pas dans Neon\n');
      await neonDb.end();
      return;
    }

    console.log('✅ La table invoices existe dans Neon\n');

    // Vérifier la structure
    const columns = await neonDb`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices'
      ORDER BY ordinal_position
    `;

    console.log('📋 Structure de la table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Compter les factures
    const [count] = await neonDb`SELECT COUNT(*) as count FROM invoices`;
    console.log(`\n📊 Nombre de factures: ${count.count}`);

    if (parseInt(count.count) > 0) {
      const invoices = await neonDb`SELECT * FROM invoices`;
      console.log('\n📄 Factures existantes:');
      invoices.forEach(inv => {
        console.log(`   - ${inv.invoice_number}: ${inv.customer_email} - ${inv.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  await neonDb.end();
  console.log('\n👋 Connexion fermée');
}

checkInvoicesTable();
