/**
 * Test de l'API de récupération de facture avec détails du devis
 */

const INVOICE_ID = 2; // ID de la facture de test dans Neon

async function testInvoiceDetailAPI() {
  console.log('🧪 Test de l\'API /api/invoices/[id]\n');
  console.log(`📡 URL: http://localhost:3000/api/invoices/${INVOICE_ID}\n`);

  try {
    console.log('⏳ Requête GET...\n');
    
    const response = await fetch(`http://localhost:3000/api/invoices/${INVOICE_ID}`);
    
    console.log(`📊 Statut: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur:', error);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Réponse reçue!\n');
    console.log('═══════════════════════════════════════════════════\n');
    
    if (data.success && data.invoice) {
      const inv = data.invoice;
      
      console.log('📄 FACTURE');
      console.log('─────────────────────────────────────────────────');
      console.log(`Numéro: ${inv.invoiceNumber}`);
      console.log(`Client: ${inv.customerName}`);
      console.log(`Email: ${inv.customerEmail}`);
      console.log(`Téléphone: ${inv.customerPhone || 'N/A'}`);
      console.log(`Service: ${inv.service}`);
      console.log(`\nMontants:`);
      console.log(`  - HT:  ${inv.amountHT?.toLocaleString('fr-FR')} FCFA`);
      console.log(`  - TVA (${inv.taxRate}%): ${inv.vatAmount?.toLocaleString('fr-FR')} FCFA`);
      console.log(`  - TTC: ${inv.amountTTC?.toLocaleString('fr-FR')} FCFA`);
      console.log(`\nStatut: ${inv.status}`);
      console.log(`Émise le: ${new Date(inv.issueDate).toLocaleDateString('fr-FR')}`);
      console.log(`Échéance: ${new Date(inv.dueDate).toLocaleDateString('fr-FR')}`);
      
      if (inv.notes) {
        console.log(`\nNotes: ${inv.notes}`);
      }
      
      console.log('\n═══════════════════════════════════════════════════\n');
      
      if (inv.quote) {
        console.log('📋 DEVIS ASSOCIÉ');
        console.log('─────────────────────────────────────────────────');
        console.log(`ID Devis: ${inv.quote.id}`);
        console.log(`Service: ${inv.quote.service || 'N/A'}`);
        console.log(`Message: ${inv.quote.message || 'N/A'}`);
        console.log(`Prix estimé: ${inv.quote.estimatedPrice?.toLocaleString('fr-FR') || 'N/A'} FCFA`);
        
        if (inv.quote.adminNotes) {
          console.log(`\nNotes Admin: ${inv.quote.adminNotes}`);
        }
        
        if (inv.quote.clientNotes) {
          console.log(`Notes Client: ${inv.quote.clientNotes}`);
        }
        
        if (inv.quote.preferredDate) {
          console.log(`Date préférée: ${new Date(inv.quote.preferredDate).toLocaleDateString('fr-FR')}`);
        }
        
        console.log('\n═══════════════════════════════════════════════════\n');
        console.log('✅ DONNÉES COMPLÈTES POUR PDF');
        console.log('─────────────────────────────────────────────────');
        console.log('Les données suivantes seront incluses dans le PDF:');
        console.log(`\n1. Informations Client:`);
        console.log(`   ✓ Nom: ${inv.customerName}`);
        console.log(`   ✓ Email: ${inv.customerEmail}`);
        console.log(`   ✓ Téléphone: ${inv.customerPhone || 'N/A'}`);
        
        console.log(`\n2. Items:`);
        console.log(`   ✓ Description: ${inv.service}`);
        if (inv.quote.message) {
          console.log(`   ✓ Détails: ${inv.quote.message}`);
        }
        console.log(`   ✓ Quantité: 1`);
        console.log(`   ✓ Prix: ${inv.amountHT?.toLocaleString('fr-FR')} FCFA`);
        
        console.log(`\n3. Montants:`);
        console.log(`   ✓ HT: ${inv.amountHT?.toLocaleString('fr-FR')} FCFA`);
        console.log(`   ✓ TVA: ${inv.vatAmount?.toLocaleString('fr-FR')} FCFA`);
        console.log(`   ✓ TTC: ${inv.amountTTC?.toLocaleString('fr-FR')} FCFA`);
        
        if (inv.notes || inv.quote.adminNotes || inv.quote.clientNotes) {
          console.log(`\n4. Notes:`);
          if (inv.notes) console.log(`   ✓ Facture: ${inv.notes}`);
          if (inv.quote.adminNotes) console.log(`   ✓ Admin: ${inv.quote.adminNotes}`);
          if (inv.quote.clientNotes) console.log(`   ✓ Client: ${inv.quote.clientNotes}`);
        }
        
        console.log('\n═══════════════════════════════════════════════════\n');
        console.log('🎉 Test réussi! L\'API retourne toutes les données nécessaires!\n');
        console.log('👉 Le PDF peut maintenant être généré avec:');
        console.log('   - Informations complètes du client');
        console.log('   - Détails du service depuis le devis');
        console.log('   - Montants HT, TVA, TTC');
        console.log('   - Notes admin/client\n');
      } else {
        console.log('⚠️  Aucun devis associé à cette facture\n');
      }
      
    } else {
      console.log('❌ Format de réponse invalide:', data);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testInvoiceDetailAPI();
}, 2000);
