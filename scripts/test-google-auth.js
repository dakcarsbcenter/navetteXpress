const { authOptions } = require('../src/lib/auth.ts');

console.log('🔍 Test de la configuration Google OAuth...\n');

// Vérifier les variables d'environnement
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID', 
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL'
];

console.log('📋 Vérification des variables d\'environnement:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar.includes('SECRET') ? '***' : value}`);
  } else {
    console.log(`❌ ${envVar}: MANQUANTE`);
  }
});

console.log('\n🔧 Configuration NextAuth:');
console.log(`✅ Secret configuré: ${!!process.env.NEXTAUTH_SECRET}`);
console.log(`✅ Google Provider: ${!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}`);

// Vérifier les providers
const providers = authOptions.providers;
console.log(`\n📦 Providers configurés: ${providers.length}`);
providers.forEach((provider, index) => {
  console.log(`  ${index + 1}. ${provider.name || provider.id}`);
});

console.log('\n🎯 URLs de redirection Google:');
console.log(`   - JavaScript Origins: ${process.env.NEXTAUTH_URL}`);
console.log(`   - Redirect URI: ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);

console.log('\n✨ Configuration terminée !');
console.log('\n📝 Prochaines étapes:');
console.log('1. Vérifiez que les URLs dans Google Cloud Console correspondent');
console.log('2. Redémarrez votre serveur de développement');
console.log('3. Testez la connexion sur /auth/signin');
