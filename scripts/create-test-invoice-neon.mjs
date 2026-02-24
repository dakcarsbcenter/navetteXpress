import postgres from 'postgres';

const neonDb = postgres('postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require', {
  ssl: 'require',
  max: 1
});

async function createTestInvoice() {
  console.log('📄 Création d\'une facture de test dans Neon...\n');

  try {
    // Vérifier si des quotes existent
    const quotes = await neonDb`SELECT id, customer_name, customer_email, customer_phone FROM quotes LIMIT 1`;
    
    if (quotes.length === 0) {
      console.log('❌ Aucun quote trouvé dans Neon. Impossible de créer une facture.\n');
      await neonDb.end();
      return;
    }

    const quote = quotes[0];
    console.log(`✅ Quote trouvé: ID ${quote.id} - ${quote.customer_name} (${quote.customer_email})\n`);

    // Générer le numéro de facture
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-00001`;

    // Calculer les montants
    const amountHT = 120000; // 120,000 FCFA HT
    const taxRate = 20;
    const taxAmount = amountHT * (taxRate / 100);
    const totalAmount = amountHT + taxAmount;

    // Date d'échéance (30 jours)
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    console.log('📋 Détails de la facture:');
    console.log(`   - Numéro: ${invoiceNumber}`);
    console.log(`   - Client: ${quote.customer_name} (${quote.customer_email})`);
    console.log(`   - Montant HT: ${amountHT.toLocaleString('fr-FR')} FCFA`);
    console.log(`   - TVA (${taxRate}%): ${taxAmount.toLocaleString('fr-FR')} FCFA`);
    console.log(`   - Montant TTC: ${totalAmount.toLocaleString('fr-FR')} FCFA`);
    console.log(`   - Échéance: ${dueDate.toLocaleDateString('fr-FR')}\n`);

    // Créer la facture
    const [invoice] = await neonDb`
      INSERT INTO invoices (
        invoice_number,
        quote_id,
        customer_name,
        customer_email,
        customer_phone,
        service,
        amount,
        tax_rate,
        tax_amount,
        total_amount,
        status,
        issue_date,
        due_date,
        created_at,
        updated_at
      ) VALUES (
        ${invoiceNumber},
        ${quote.id},
        ${quote.customer_name},
        ${quote.customer_email},
        ${quote.customer_phone || null},
        'Service de transport premium',
        ${amountHT},
        ${taxRate},
        ${taxAmount},
        ${totalAmount},
        'pending',
        ${issueDate.toISOString()},
        ${dueDate.toISOString()},
        ${issueDate.toISOString()},
        ${issueDate.toISOString()}
      )
      RETURNING *
    `;

    console.log('✅ Facture créée avec succès!\n');
    console.log('📄 Détails de la facture créée:');
    console.log(`   - ID: ${invoice.id}`);
    console.log(`   - Numéro: ${invoice.invoice_number}`);
    console.log(`   - Statut: ${invoice.status}`);
    console.log(`   - Montant TTC: ${parseFloat(invoice.total_amount).toLocaleString('fr-FR')} FCFA\n`);

    // Vérifier le total des factures
    const [count] = await neonDb`SELECT COUNT(*) as count FROM invoices`;
    console.log(`📊 Total de factures dans Neon: ${count.count}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }

  await neonDb.end();
  console.log('👋 Connexion fermée');
}

createTestInvoice();
