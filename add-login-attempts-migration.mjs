import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Fonction pour lire le fichier .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Le fichier .env.local n\'existe pas');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
}

// Charger les variables d'environnement
loadEnvFile();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie dans .env.local');
  process.exit(1);
}

const client = neon(DATABASE_URL);
const db = drizzle({ client });

async function addLoginAttemptFields() {
  console.log('🔄 Début de la migration : ajout des champs de tentatives de connexion...\n');

  try {
    // Ajouter les colonnes pour le suivi des tentatives de connexion
    console.log('1️⃣ Ajout de la colonne login_attempts...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0 NOT NULL
    `);
    console.log('✅ Colonne login_attempts ajoutée');

    console.log('\n2️⃣ Ajout de la colonne account_locked_until...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP
    `);
    console.log('✅ Colonne account_locked_until ajoutée');

    console.log('\n3️⃣ Ajout de la colonne last_failed_login...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP
    `);
    console.log('✅ Colonne last_failed_login ajoutée');

    // Initialiser les valeurs pour les utilisateurs existants
    console.log('\n4️⃣ Initialisation des valeurs pour les utilisateurs existants...');
    await db.execute(sql`
      UPDATE users 
      SET login_attempts = 0 
      WHERE login_attempts IS NULL
    `);
    console.log('✅ Valeurs initialisées');

    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n📝 Résumé des modifications :');
    console.log('  - login_attempts : Nombre de tentatives de connexion échouées (défaut: 0)');
    console.log('  - account_locked_until : Date jusqu\'à laquelle le compte est bloqué');
    console.log('  - last_failed_login : Date de la dernière tentative échouée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

addLoginAttemptFields()
  .then(() => {
    console.log('\n🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Échec du script:', error);
    process.exit(1);
  });
