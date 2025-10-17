/**
 * Script pour corriger toutes les APIs qui vérifient encore 'manage'
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const files = [
  'src/app/api/quotes/route.ts',
  'src/app/api/quotes/[id]/route.ts',
  'src/app/api/quotes/client/route.ts',
  'src/app/api/bookings/route.ts',
  'src/app/api/client/vehicles/[id]/route.ts',
];

const oldPattern = `    // Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action);`;

const oldPattern2 = `    // Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action)`;

const newPattern = `    // Retourner true si la permission existe
    return permissions.length > 0;`;

let fixed = 0;
let errors = 0;

files.forEach(filePath => {
  const fullPath = join(__dirname, '..', filePath);
  
  try {
    let content = readFileSync(fullPath, 'utf-8');
    
    if (content.includes("p.action === 'manage'")) {
      // Remplacer le pattern
      content = content.replace(oldPattern, newPattern);
      content = content.replace(oldPattern2, newPattern);
      
      // Ajouter l'action dans le WHERE
      const whereRegex = /\.where\(and\(\s+eq\(rolePermissionsTable\.roleName,\s*userRole\),\s+eq\(rolePermissionsTable\.resource,\s*'(\w+)'\),\s+eq\(rolePermissionsTable\.allowed,\s*true\)\s*\)\)/g;
      
      content = content.replace(whereRegex, (match, resource) => {
        return `.where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, '${resource}'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ))`;
      });
      
      writeFileSync(fullPath, content, 'utf-8');
      console.log(`✅ ${filePath}`);
      fixed++;
    } else {
      console.log(`⏭️  ${filePath} (déjà corrigé ou pas de 'manage')`);
    }
  } catch (error) {
    console.error(`❌ ${filePath}: ${error.message}`);
    errors++;
  }
});

console.log(`\n📊 Résumé:`);
console.log(`   ✅ Fichiers corrigés: ${fixed}`);
console.log(`   ❌ Erreurs: ${errors}`);
console.log(`\n✅ Terminé!`);
