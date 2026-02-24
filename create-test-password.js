const bcrypt = require('bcryptjs');

async function createTestPassword() {
  // Créer un hash pour un mot de passe test
  const plainPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  
  console.log('🔐 Mot de passe de test créé:');
  console.log(`  Mot de passe en clair: ${plainPassword}`);
  console.log(`  Hash: ${hashedPassword}`);
  
  // Vérifier que le hash fonctionne
  const isValid = await bcrypt.compare(plainPassword, hashedPassword);
  console.log(`  Validation du hash: ${isValid ? '✅' : '❌'}`);
}

createTestPassword().catch(console.error);