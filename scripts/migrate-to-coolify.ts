import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/schema';
import { getDb } from '../src/db';

// URL de la base Neon (source)
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrateData() {
  console.log('🚀 Début de la migration Neon → Coolify PostgreSQL');
  
  try {
    // Connexion à Neon (source)
    console.log('📡 Connexion à la base Neon...');
    const neonSql = neon(NEON_DATABASE_URL);
    const neonDb = drizzle(neonSql, { schema });
    
    // Connexion à Coolify (destination) - utilise DATABASE_URL de l'environnement
    console.log('📡 Connexion à la base Coolify...');
    const coolifyDb = getDb();
    
    // Liste des tables dans l'ordre de dépendance
    const tables = [
      { name: 'users', table: schema.users },
      { name: 'accounts', table: schema.accounts },
      { name: 'sessions', table: schema.sessions },
      { name: 'verification_tokens', table: schema.verificationTokens },
      { name: 'custom_roles', table: schema.customRolesTable },
      { name: 'vehicles', table: schema.vehiclesTable },
      { name: 'bookings', table: schema.bookingsTable },
      { name: 'reviews', table: schema.reviewsTable },
      { name: 'permissions', table: schema.permissionsTable },
      { name: 'role_permissions', table: schema.rolePermissionsTable },
      { name: 'quotes', table: schema.quotesTable },
    ];
    
    let totalMigrated = 0;
    
    for (const { name, table } of tables) {
      try {
        console.log(`\n📦 Migration de la table: ${name}`);
        
        // Récupérer les données depuis Neon
        const data = await neonDb.select().from(table);
        console.log(`   ├─ ${data.length} enregistrements trouvés`);
        
        if (data.length === 0) {
          console.log(`   └─ ⏭️  Table vide, passage à la suivante`);
          continue;
        }
        
        // Insérer dans Coolify avec gestion des conflits
        let inserted = 0;
        for (const row of data) {
          try {
            await coolifyDb.insert(table).values(row).onConflictDoNothing();
            inserted++;
          } catch (error: any) {
            console.error(`   ├─ ⚠️  Erreur insertion:`, error?.message || error);
          }
        }
        
        console.log(`   └─ ✅ ${inserted}/${data.length} enregistrements migrés`);
        totalMigrated += inserted;
        
      } catch (error: any) {
        console.error(`   └─ ❌ Erreur sur la table ${name}:`, error?.message || error);
      }
    }
    
    console.log(`\n✅ Migration terminée ! ${totalMigrated} enregistrements au total.`);
    
    // Vérification
    console.log('\n🔍 Vérification des données migrées:');
    const userCount = await coolifyDb.select().from(schema.users);
    const vehicleCount = await coolifyDb.select().from(schema.vehiclesTable);
    const bookingCount = await coolifyDb.select().from(schema.bookingsTable);
    
    console.log(`   ├─ Users: ${userCount.length}`);
    console.log(`   ├─ Vehicles: ${vehicleCount.length}`);
    console.log(`   └─ Bookings: ${bookingCount.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erreur de migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
migrateData();
