import postgres from 'postgres';

const localDb = postgres('postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress', {
  ssl: false,
  max: 1
});

const neonDb = postgres('postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require', {
  ssl: 'require',
  max: 1
});

async function copyInvoices() {
  console.log('📄 Copie des factures de local vers Neon...\n');

  try {
    // Lire les factures de la base locale
    const localInvoices = await localDb`SELECT * FROM invoices`;
    
    console.log(`📊 ${localInvoices.length} facture(s) trouvée(s) dans la base locale\n`);

    if (localInvoices.length === 0) {
      console.log('⚠️  Aucune facture à copier\n');
      await localDb.end();
      await neonDb.end();
      return;
    }

    // Afficher les factures
    console.log('📋 Factures à copier:');
    localInvoices.forEach(inv => {
      console.log(`   - ${inv.invoice_number}: ${inv.customer_email} - ${inv.total_amount} FCFA - ${inv.status}`);
    });

    // Copier vers Neon
    console.log('\n⏳ Copie en cours...');
    
    await neonDb`INSERT INTO invoices ${neonDb(localInvoices)}`;
    
    console.log('✅ Factures copiées avec succès!\n');

    // Vérifier dans Neon
    const neonInvoices = await neonDb`SELECT * FROM invoices`;
    console.log(`📊 ${neonInvoices.length} facture(s) maintenant dans Neon\n`);

    if (neonInvoices.length > 0) {
      console.log('📋 Factures dans Neon:');
      neonInvoices.forEach(inv => {
        console.log(`   - ${inv.invoice_number}: ${inv.customer_email} - ${inv.total_amount} FCFA - ${inv.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  await localDb.end();
  await neonDb.end();
  console.log('\n👋 Connexions fermées');
}

copyInvoices();
