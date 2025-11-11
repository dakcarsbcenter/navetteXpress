/**
 * Script de test pour vérifier l'API des factures
 * Usage: node scripts/test-invoices-api.mjs
 */

import postgres from 'postgres';

const DATABASE_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  connection: {
    application_name: 'test_invoices_api',
  },
});

async function testInvoicesAPI() {
  try {
    console.log('🔍 Vérification de l\'API des factures...\n');

    // Test 1: Vérifier que la table existe
    console.log('1️⃣ Test: Vérifier l\'existence de la table invoices');
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices'
      );
    `;
    console.log(`   ✅ Table invoices existe:`, tableCheck[0].exists);

    // Test 2: Compter les factures
    console.log('\n2️⃣ Test: Compter les factures dans la base');
    const countResult = await sql`
      SELECT COUNT(*) as count FROM invoices;
    `;
    const invoiceCount = parseInt(countResult[0].count);
    console.log(`   📊 Nombre de factures: ${invoiceCount}`);

    // Test 3: Récupérer quelques factures avec tous les champs
    if (invoiceCount > 0) {
      console.log('\n3️⃣ Test: Récupérer les factures avec mapping des champs');
      const invoices = await sql`
        SELECT 
          id,
          invoice_number,
          quote_id,
          customer_name,
          customer_email,
          customer_phone,
          service,
          amount,
          tax_amount,
          total_amount,
          status,
          issue_date,
          due_date,
          paid_date,
          payment_method,
          notes,
          created_at,
          updated_at
        FROM invoices
        LIMIT 3;
      `;

      console.log(`   📋 ${invoices.length} facture(s) récupérée(s):\n`);
      
      invoices.forEach((inv, index) => {
        console.log(`   Facture #${index + 1}:`);
        console.log(`      - Numéro: ${inv.invoice_number}`);
        console.log(`      - Client: ${inv.customer_name} (${inv.customer_email})`);
        console.log(`      - Service: ${inv.service}`);
        console.log(`      - Montant HT: ${inv.amount} FCFA`);
        console.log(`      - TVA: ${inv.tax_amount} FCFA`);
        console.log(`      - Total TTC: ${inv.total_amount} FCFA`);
        console.log(`      - Statut: ${inv.status}`);
        console.log(`      - Date émission: ${inv.issue_date}`);
        console.log(`      - Date échéance: ${inv.due_date}`);
        if (inv.paid_date) {
          console.log(`      - Date paiement: ${inv.paid_date}`);
          console.log(`      - Moyen paiement: ${inv.payment_method}`);
        }
        console.log('');
      });

      // Test 4: Vérifier le mapping pour le frontend
      console.log('4️⃣ Test: Mapping des données pour le frontend');
      const mappedInvoice = {
        ...invoices[0],
        amountHT: parseFloat(invoices[0].amount),
        vatAmount: parseFloat(invoices[0].tax_amount),
        amountTTC: parseFloat(invoices[0].total_amount),
        customerId: invoices[0].customer_email,
        invoiceNumber: invoices[0].invoice_number,
        quoteId: invoices[0].quote_id,
        customerName: invoices[0].customer_name,
        customerEmail: invoices[0].customer_email,
        issueDate: invoices[0].issue_date,
        dueDate: invoices[0].due_date,
        paidDate: invoices[0].paid_date,
        paymentMethod: invoices[0].payment_method,
      };
      console.log('   ✅ Exemple de données mappées:');
      console.log(JSON.stringify(mappedInvoice, null, 2));
    } else {
      console.log('\n⚠️  Aucune facture dans la base pour tester le mapping');
      console.log('   💡 Créez un devis et validez-le pour générer une facture');
    }

    // Test 5: Vérifier les statuts
    console.log('\n5️⃣ Test: Compter les factures par statut');
    const statusCounts = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount::numeric) as total
      FROM invoices
      GROUP BY status;
    `;
    
    if (statusCounts.length > 0) {
      console.log('   📊 Répartition par statut:');
      statusCounts.forEach(stat => {
        console.log(`      - ${stat.status}: ${stat.count} facture(s), Total: ${stat.total || 0} FCFA`);
      });
    } else {
      console.log('   ℹ️  Aucune donnée de statut disponible');
    }

    console.log('\n✅ Tous les tests terminés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await sql.end();
  }
}

testInvoicesAPI();
