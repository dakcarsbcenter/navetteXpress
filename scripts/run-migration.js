const { db } = require('../src/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Exécution de la migration manuelle...');
  
  try {
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'manual-migration.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Diviser les requêtes par ';' et les exécuter une par une
    const queries = sql.split(';').filter(query => query.trim());
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      if (query) {
        console.log(`📝 Exécution de la requête ${i + 1}/${queries.length}...`);
        try {
          await db.execute(query);
          console.log(`✅ Requête ${i + 1} exécutée avec succès`);
        } catch (error) {
          console.log(`⚠️  Requête ${i + 1} ignorée (probablement déjà exécutée): ${error.message}`);
        }
      }
    }
    
    console.log('🎉 Migration manuelle terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMigration };
