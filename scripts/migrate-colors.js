#!/usr/bin/env node

// Utilitaire de migration des couleurs NavetteXpress
// Remplace l'ancienne palette orange par la nouvelle palette moderne

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const colorMappings = {
  // Couleurs orange principales
  'bg-orange-500': 'bg-gradient-to-r from-[#FF7E38] to-[#E6682F]',
  'hover:bg-orange-600': 'hover:from-[#E6682F] hover:to-[#D4571F]',
  'bg-orange-600': 'bg-[#E6682F]',
  'hover:bg-orange-700': 'hover:bg-[#D4571F]',
  
  // Couleurs de texte
  'text-orange-600': 'text-[#FF7E38]',
  'text-orange-500': 'text-[#FF7E38]',
  'text-orange-800': 'text-[#FF7E38]',
  'text-orange-400': 'text-[#FFB885]',
  'text-orange-200': 'text-[#FFB885]',
  
  // Backgrounds clairs
  'bg-orange-100': 'bg-[#FFB885]/20',
  'bg-orange-50': 'bg-[#FFB885]/10',
  'bg-orange-900/50': 'bg-[#FF7E38]/20',
  'bg-orange-900/20': 'bg-[#FF7E38]/10',
  
  // Bordures
  'border-orange-200': 'border-[#FFB885]/30',
  'border-orange-800': 'border-[#FF7E38]/30',
  'border-orange-500': 'border-[#FF7E38]',
  
  // Focus rings
  'focus:ring-orange-500': 'focus:ring-[#FF7E38]',
  'ring-orange-500': 'ring-[#FF7E38]',
  
  // Gradients dans les notifications (pour maintenir la cohérence)
  'from-amber-400 via-yellow-500 to-orange-600': 'from-[#FFB885] via-[#FF7E38] to-[#E6682F]',
};

async function migrateColors() {
  console.log('🎨 Migration de la palette de couleurs NavetteXpress...\n');
  
  // Trouver tous les fichiers .tsx et .ts
  const files = await glob('src/**/*.{tsx,ts}', { 
    ignore: ['src/styles/colors.ts', 'src/app/palette/page.tsx'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;
  
  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let fileReplacements = 0;
      
      // Appliquer chaque mapping
      for (const [oldColor, newColor] of Object.entries(colorMappings)) {
        const regex = new RegExp(escapeRegExp(oldColor), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newColor);
          fileReplacements += matches.length;
          totalReplacements += matches.length;
        }
      }
      
      // Sauvegarder seulement si des changements ont été faits
      if (fileReplacements > 0) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ ${file}: ${fileReplacements} remplacements`);
        filesModified++;
      }
      
    } catch (error) {
      console.error(`❌ Erreur dans ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Migration terminée!`);
  console.log(`📊 ${totalReplacements} remplacements dans ${filesModified} fichiers\n`);
  
  // Afficher un résumé des nouvelles couleurs
  console.log('🎨 Nouvelle palette appliquée:');
  console.log('  🟠 Primaire: #FF7E38 (Orange moderne)');
  console.log('  🔵 Secondaire: #0F5B8A (Bleu océan)');
  console.log('  ⚫ Neutre: #1E293B (Charcoal)');
  console.log('  ✅ Focus: Ring #FF7E38');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Exécuter la migration
migrateColors().catch(console.error);

export default migrateColors;