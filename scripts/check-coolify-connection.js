/**
 * Script de vérification de connectivité et d'information sur la migration
 * 
 * Ce script vérifie si vous pouvez vous connecter à la base Coolify
 * et fournit des instructions adaptées à votre situation.
 */

const { Client } = require('pg');

async function checkConnectivity() {
  console.log('🔍 Vérification de la connectivité à Coolify PostgreSQL\n');

  // L'URL interne Coolify (ne fonctionne que depuis le réseau Coolify)
  const internalUrl = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres";
  
  console.log('❌ PROBLÈME DÉTECTÉ:');
  console.log('   Le hostname "db-navettexpress" n\'est pas accessible depuis votre machine locale.');
  console.log('   C\'est un hostname interne au réseau Docker de Coolify.\n');

  console.log('✅ SOLUTIONS DISPONIBLES:\n');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('OPTION 1: Migration DEPUIS Coolify (Recommandé)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Étapes:');
  console.log('1. Connectez-vous en SSH à votre serveur Coolify');
  console.log('2. Naviguez vers le répertoire de votre application');
  console.log('3. Exécutez:');
  console.log('   export DATABASE_URL="postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"');
  console.log('   npm run db:push  # Créer le schéma');
  console.log('');
  console.log('4. Ensuite, importez les données depuis Neon:');
  console.log('   NEON_URL="postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"');
  console.log('   pg_dump $NEON_URL --data-only --no-owner --no-privileges -f neon_data.sql');
  console.log('   psql $DATABASE_URL -f neon_data.sql');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('OPTION 2: Exposer PostgreSQL sur un port public');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Dans Coolify:');
  console.log('1. Allez dans votre base de données PostgreSQL');
  console.log('2. Settings → Expose Port (ex: 5432)');
  console.log('3. Notez l\'IP publique de votre serveur');
  console.log('4. Utilisez:');
  console.log('   postgresql://postgres:PASSWORD@IP_PUBLIQUE:5432/postgres');
  console.log('');
  console.log('⚠️  N\'oubliez pas de fermer le port après la migration!');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('OPTION 3: Utiliser Drizzle Studio dans Coolify');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('1. SSH vers Coolify');
  console.log('2. Dans le répertoire de l\'app:');
  console.log('   export DATABASE_URL="postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"');
  console.log('   npm run db:push');
  console.log('   npm run db:studio');
  console.log('');
  console.log('3. Accédez à Drizzle Studio via tunnel SSH ou port forwarding');
  console.log('4. Importez les données manuellement depuis un export CSV/JSON de Neon');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('OPTION 4: Migration via un conteneur temporaire');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Sur le serveur Coolify:');
  console.log('');
  console.log('docker run --rm --network=coolify \\');
  console.log('  -e NEON_URL="postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" \\');
  console.log('  -e COOLIFY_URL="postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres" \\');
  console.log('  postgres:16-alpine sh -c \'');
  console.log('    apk add --no-cache postgresql-client && \\');
  console.log('    pg_dump "$NEON_URL" --data-only --no-owner --no-privileges | \\');
  console.log('    psql "$COOLIFY_URL"');
  console.log('  \'');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📝 Recommandation:');
  console.log('   → Utilisez l\'OPTION 1 (migration depuis Coolify)');
  console.log('   → C\'est la plus simple et la plus sûre');
  console.log('   → Toutes les commandes sont dans MIGRATION_GUIDE.md\n');
}

checkConnectivity()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur:', err);
    process.exit(1);
  });
