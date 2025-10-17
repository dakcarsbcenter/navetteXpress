/**
 * Script pour corriger toutes les fonctions de vérification de permissions
 * qui utilisent encore l'ancienne logique avec 'manage'
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const oldPattern = `// Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action)`;

const oldPattern2 = `// Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action);`;

const newPattern = `// Retourner true si la permission existe
    return permissions.length > 0`;

const oldWhereClause = `.where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource,`;

const newWhereClause = `.where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource,`;

// Fonction pour trouver tous les fichiers TypeScript dans un répertoire
function findTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixPermissionCheck(content) {
  let fixed = content;
  let changes = 0;

  // Pattern 1: Remplacer le check some() par length > 0
  if (fixed.includes("p.action === 'manage' || p.action === action")) {
    fixed = fixed.replace(
      /\/\/ Vérifier si l'utilisateur a 'manage' ou l'action spécifique\s+return permissions\.some\(p => p\.action === 'manage' \|\| p\.action === action\);?/g,
      "// Retourner true si la permission existe\n    return permissions.length > 0"
    );
    changes++;
  }

  // Pattern 2: Ajouter l'action dans la clause WHERE si elle n'y est pas
  const regex = /\.where\(and\(\s+eq\(rolePermissionsTable\.roleName,\s*userRole\),\s+eq\(rolePermissionsTable\.resource,\s*'?(\w+)'?\),\s+eq\(rolePermissionsTable\.allowed,\s*true\)\s*\)\)/g;
  
  if (regex.test(content) && !content.includes('eq(rolePermissionsTable.action, action)')) {
    fixed = fixed.replace(
      /\.where\(and\(\s+eq\(rolePermissionsTable\.roleName,\s*userRole\),\s+eq\(rolePermissionsTable\.resource,\s*(['"]?\w+['"]?)\),\s+eq\(rolePermissionsTable\.allowed,\s*true\)\s*\)\)/g,
      `.where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, $1),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ))`
    );
    changes++;
  }

  return { fixed, changes };
}

// Main
const srcDir = join(__dirname, '..', 'src', 'app', 'api');
const tsFiles = findTsFiles(srcDir);

console.log(`🔍 Recherche de fichiers à corriger dans: ${srcDir}\n`);

let totalFiles = 0;
let totalChanges = 0;

tsFiles.forEach(filePath => {
  const content = readFileSync(filePath, 'utf-8');
  
  if (content.includes("p.action === 'manage'")) {
    const { fixed, changes } = fixPermissionCheck(content);
    
    if (changes > 0) {
      writeFileSync(filePath, fixed, 'utf-8');
      console.log(`✅ ${filePath.replace(join(__dirname, '..'), '')} - ${changes} modification(s)`);
      totalFiles++;
      totalChanges += changes;
    }
  }
});

console.log(`\n📊 Résumé:`);
console.log(`   - Fichiers modifiés: ${totalFiles}`);
console.log(`   - Total des modifications: ${totalChanges}`);
console.log(`\n✅ Correction terminée!`);
