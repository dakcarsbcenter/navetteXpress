/**
 * Script pour créer une facture de test dans la base de données
 * Usage: node scripts/create-test-invoice.mjs
 */

import postgres from 'postgres';

const DATABASE_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  connection: {
    application_name: 'create_test_invoice',
  },
});

async function createTestInvoice() {
  try {
    console.log('🧾 Création d\'une facture de test...\n');

    // Vérifier s'il y a des devis acceptés
    const acceptedQuotes = await sql`
      SELECT id, customer_name, customer_email, customer_phone, 
             estimated_price, service
      FROM quotes
      WHERE status = 'accepted'
      LIMIT 1;
    `;

    let quoteId, customerName, customerEmail, customerPhone, amount, service;

    if (acceptedQuotes.length > 0) {
      const quote = acceptedQuotes[0];
      quoteId = quote.id;
      customerName = quote.customer_name;
      customerEmail = quote.customer_email;
      customerPhone = quote.customer_phone;
      amount = quote.estimated_price;
      service = quote.service || 'Service de transport';
      console.log(`✅ Devis accepté trouvé: #${quoteId}`);
    } else {
      // Créer des données de test
      quoteId = 999; // ID fictif
      customerName = 'Client Test';
      customerEmail = 'test@example.com';
      customerPhone = '+33612345678';
      amount = 50000;
      service = 'Service de transport - TEST';
      console.log(`⚠️  Aucun devis accepté trouvé, utilisation de données fictives`);
    }

    // Calculer les montants
    const amountHT = parseFloat(amount);
    const vatRate = 20.00;
    const vatAmount = amountHT * (vatRate / 100);
    const totalAmount = amountHT + vatAmount;

    // Générer le numéro de facture
    const lastInvoice = await sql`
      SELECT invoice_number 
      FROM invoices 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    let invoiceNumber;
    const currentYear = new Date().getFullYear();

    if (lastInvoice.length > 0) {
      const lastNumber = lastInvoice[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      const newSequence = String(lastSequence + 1).padStart(5, '0');
      invoiceNumber = `INV-${currentYear}-${newSequence}`;
    } else {
      invoiceNumber = `INV-${currentYear}-00001`;
    }

    console.log(`\n📋 Détails de la facture:`);
    console.log(`   Numéro: ${invoiceNumber}`);
    console.log(`   Client: ${customerName}`);
    console.log(`   Email: ${customerEmail}`);
    console.log(`   Service: ${service}`);
    console.log(`   Montant HT: ${amountHT} FCFA`);
    console.log(`   TVA (${vatRate}%): ${vatAmount} FCFA`);
    console.log(`   Total TTC: ${totalAmount} FCFA`);

    // Calculer les dates
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Insérer la facture
    const result = await sql`
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
        due_date
      ) VALUES (
        ${invoiceNumber},
        ${quoteId},
        ${customerName},
        ${customerEmail},
        ${customerPhone},
        ${service},
        ${amountHT},
        ${vatRate},
        ${vatAmount},
        ${totalAmount},
        'pending',
        ${issueDate.toISOString()},
        ${dueDate.toISOString()}
      )
      RETURNING *;
    `;

    console.log('\n✅ Facture créée avec succès!');
    console.log('\nDonnées créées:');
    console.log(JSON.stringify(result[0], null, 2));

    // Vérifier la facture
    console.log('\n🔍 Vérification de la facture dans la base...');
    const verification = await sql`
      SELECT * FROM invoices WHERE invoice_number = ${invoiceNumber};
    `;

    if (verification.length > 0) {
      console.log('✅ Facture vérifiée dans la base de données');
      
      // Test de mapping
      const invoice = verification[0];
      const mapped = {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        quoteId: invoice.quote_id,
        customerId: invoice.customer_email,
        customerName: invoice.customer_name,
        amountHT: parseFloat(invoice.amount),
        vatAmount: parseFloat(invoice.tax_amount),
        amountTTC: parseFloat(invoice.total_amount),
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
      };
      
      console.log('\n📊 Données mappées pour le frontend:');
      console.log(JSON.stringify(mapped, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de la facture:', error);
  } finally {
    await sql.end();
  }
}

createTestInvoice();
