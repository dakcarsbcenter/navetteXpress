// Test simple de connexion avec les données existantes
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, bookingsTable, reviewsTable } from "../src/schema";
import { eq, and, count, sum, avg } from "drizzle-orm";

// Configuration de la base de données
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);
const db = drizzle({ client: sql });

const testDriverStats = async () => {
  try {
    console.log('🔍 Recherche du chauffeur Alain Petit...\n');

    // Trouver Alain Petit
    const driver = await db.select()
      .from(users)
      .where(and(
        eq(users.name, 'Alain Petit'),
        eq(users.role, 'driver')
      ))
      .limit(1);

    if (driver.length === 0) {
      console.log('❌ Alain Petit non trouvé');
      return;
    }

    console.log(`✅ Chauffeur trouvé: ${driver[0].name} (${driver[0].email})`);
    const driverId = driver[0].id;

    // Récupérer ses statistiques
    console.log('\n📊 Calcul des statistiques...');

    // Courses totales
    const totalRides = await db.select({ count: count() })
      .from(bookingsTable)
      .where(eq(bookingsTable.driverId, driverId));

    // Courses complétées
    const completedRides = await db.select({ count: count() })
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.driverId, driverId),
        eq(bookingsTable.status, 'completed')
      ));

    // Revenus totaux
    const earnings = await db.select({ 
      total: sum(bookingsTable.price) 
    })
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.driverId, driverId),
      eq(bookingsTable.status, 'completed')
    ));

    // Note moyenne
    const ratings = await db.select({ 
      average: avg(reviewsTable.rating),
      count: count(reviewsTable.rating)
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.driverId, driverId));

    // Afficher les résultats
    console.log(`\n📈 Statistiques d'Alain Petit:`);
    console.log(`- Courses totales: ${totalRides[0]?.count || 0}`);
    console.log(`- Courses complétées: ${completedRides[0]?.count || 0}`);
    console.log(`- Revenus totaux: ${earnings[0]?.total || 0} FCFA`);
    console.log(`- Note moyenne: ${parseFloat(ratings[0]?.average || '0').toFixed(1)}/5 (${ratings[0]?.count || 0} avis)`);
    
    if (totalRides[0]?.count > 0 && completedRides[0]?.count > 0) {
      const completionRate = ((completedRides[0].count / totalRides[0].count) * 100).toFixed(1);
      console.log(`- Taux de completion: ${completionRate}%`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testDriverStats();