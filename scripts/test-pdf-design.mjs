/**
 * Test rapide du nouveau design de facture PDF
 * Ce script peut être exécuté dans la console du navigateur
 */

// Données de test pour la facture
const testInvoiceData = {
  invoiceNumber: 'INV-2025-00002',
  customerName: 'clientNavette',
  customerEmail: 'clientnavette@gmail.com',
  customerPhone: '770000000',
  service: 'tour, airport - Demande de devis pour 2 personne(s)',
  amountHT: 78000,
  vatAmount: 15600,
  amountTTC: 93600,
  taxRate: 20,
  issueDate: '11/11/2025',
  dueDate: '11/12/2025',
  status: 'pending',
  items: [
    {
      description: 'tour, airport - Demande de devis pour 2 personne(s).\nServices: tour, airport\nDurée: 3 jour(s)\nDépart: DAKAR\nDestination: MBOUR\nBagages cabine: 2\nBagages soute: 0\nMode de paiement souhaité: cash',
      quantity: 1,
      price: 78000,
      total: 78000
    }
  ],
  notes: 'Description: Voyage de groupe avec guide touristique'
};

console.log('📄 Données de test facture:', testInvoiceData);
console.log('\n✅ Pour tester le PDF:');
console.log('1. Ouvrir le dashboard admin ou client');
console.log('2. Aller dans "Factures"');
console.log('3. Cliquer sur "Télécharger PDF"');
console.log('\n🎨 Nouveau design avec:');
console.log('  ✓ Logo NavetteXpress (ovale orange)');
console.log('  ✓ Tous les textes en français');
console.log('  ✓ Couleurs: Orange (#f97316) + Rouge (#dc2626)');
console.log('  ✓ Cadres colorés pour hiérarchiser');
console.log('  ✓ Structure professionnelle');
console.log('\n📋 Vérifications à faire:');
console.log('  □ Logo visible en haut');
console.log('  □ Titre "facture" (pas "invoice")');
console.log('  □ "Facturé à" (pas "Billed to")');
console.log('  □ Tableau: DESCRIPTION, QTÉ, PRIX, TOTAL');
console.log('  □ Total dans cadre rouge');
console.log('  □ Footer avec bloc rouge + cadres colorés');
