/**
 * Script pour construire et exporter les templates d'emails
 * Usage: node build-email-templates.mjs
 */

import { render } from '@react-email/render';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonction pour charger dynamiquement un module ESM
async function loadEmailTemplate(templatePath) {
  try {
    const module = await import(templatePath);
    return module.default;
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${templatePath}:`, error.message);
    return null;
  }
}

async function buildEmailTemplates() {
  console.log('🔨 Construction des templates d\'emails...\n');

  const templatesDir = path.join(__dirname, 'src', 'emails');
  const outputDir = path.join(__dirname, 'email-templates-html');

  // Créer le dossier de sortie
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Liste des templates à construire
  const templates = [
    {
      name: 'PasswordResetEmail',
      file: 'PasswordResetEmail.tsx',
      props: {
        userName: 'Jean Dupont',
        resetUrl: 'http://localhost:3000/auth/reset-password/confirm?token=abc123',
        expiresIn: '1 heure'
      }
    },
    {
      name: 'AccountLockedEmail',
      file: 'AccountLockedEmail.tsx',
      props: {
        userName: 'Jean Dupont',
        unlockTime: 'vendredi 15 novembre 2025 à 14:30',
        resetUrl: 'http://localhost:3000/auth/reset-password'
      }
    },
    {
      name: 'WelcomeEmail',
      file: 'WelcomeEmail.tsx',
      props: {}
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      console.log(`📧 Construction de ${template.name}...`);
      
      const templatePath = path.join(templatesDir, template.file);
      const Component = await loadEmailTemplate(`file://${templatePath}`);

      if (!Component) {
        console.error(`❌ Impossible de charger ${template.name}`);
        errorCount++;
        continue;
      }

      // Rendre le template en HTML
      const html = render(Component(template.props));

      // Sauvegarder le HTML
      const outputPath = path.join(outputDir, `${template.name}.html`);
      fs.writeFileSync(outputPath, html, 'utf-8');

      console.log(`✅ ${template.name} → ${outputPath}`);
      successCount++;

    } catch (error) {
      console.error(`❌ Erreur lors de la construction de ${template.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Résumé :');
  console.log(`✅ ${successCount} template(s) construit(s) avec succès`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreur(s)`);
  }
  console.log(`\n📁 Fichiers HTML disponibles dans : ${outputDir}`);
  console.log('\n💡 Vous pouvez ouvrir ces fichiers dans un navigateur pour prévisualiser les emails.');
}

buildEmailTemplates().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
