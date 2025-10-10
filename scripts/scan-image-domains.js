/**
 * Script pour scanner tous les domaines d'images dans la base de données
 * et générer automatiquement la configuration pour next.config.ts
 * 
 * Usage: node scripts/scan-image-domains.js
 */

const mysql = require('mysql2/promise');

async function scanImageDomains() {
  try {
    console.log('🔍 Scan des domaines d\'images dans la base de données...\n');

    // Connexion à la base de données
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Ajustez selon votre config
      database: 'navette_xpress'
    });

    // Récupérer toutes les photos
    const [rows] = await connection.execute(
      'SELECT DISTINCT photo FROM vehicles WHERE photo IS NOT NULL AND photo != ""'
    );

    // Extraire les domaines
    const domains = new Set();
    
    for (const row of rows) {
      try {
        const url = new URL(row.photo);
        domains.add(url.hostname);
      } catch (error) {
        console.log(`⚠️  URL invalide: ${row.photo}`);
      }
    }

    await connection.end();

    // Afficher les résultats
    console.log(`✅ ${domains.size} domaine(s) unique(s) trouvé(s):\n`);
    
    const sortedDomains = Array.from(domains).sort();
    sortedDomains.forEach((domain, index) => {
      console.log(`${index + 1}. ${domain}`);
    });

    // Générer la configuration
    console.log('\n📋 Configuration à ajouter dans next.config.ts:\n');
    console.log('remotePatterns: [');
    
    sortedDomains.forEach(domain => {
      console.log(`  {`);
      console.log(`    protocol: 'https',`);
      console.log(`    hostname: '${domain}',`);
      console.log(`  },`);
    });
    
    console.log(']');

    // Vérifier Cloudinary
    const cloudinaryCount = Array.from(domains).filter(d => d.includes('cloudinary')).length;
    const externalCount = domains.size - cloudinaryCount;

    console.log('\n📊 Statistiques:');
    console.log(`  - Images Cloudinary: ${cloudinaryCount > 0 ? '✅' : '❌'}`);
    console.log(`  - Images externes: ${externalCount}`);
    
    if (externalCount > 0) {
      console.log('\n⚠️  RECOMMANDATION:');
      console.log('  Vous avez encore des images externes.');
      console.log('  Utilisez l\'outil de migration: http://localhost:3000/admin/migrate-images');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

scanImageDomains();


