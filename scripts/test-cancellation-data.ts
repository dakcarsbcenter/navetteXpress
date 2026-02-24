// Script pour tester les données d'annulation
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { bookingsTable, users } from '../src/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

async function testCancellationData() {
  try {
    console.log('🔍 Test des données d\'annulation...');
    
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    
    // Créer des alias pour les jointures
    const driverUsers = alias(users, 'driver_users');
    const cancelledByUsers = alias(users, 'cancelled_by_users');
    
    // Récupérer les réservations annulées avec leurs détails
    const cancelledBookings = await db
      .select({
        booking: bookingsTable,
        cancelledByUser: {
          name: cancelledByUsers.name,
          role: cancelledByUsers.role
        }
      })
      .from(bookingsTable)
      .leftJoin(cancelledByUsers, eq(bookingsTable.cancelledBy, cancelledByUsers.id))
      .where(eq(bookingsTable.status, 'cancelled'));
    
    console.log('📊 Réservations annulées trouvées:', cancelledBookings.length);
    
    cancelledBookings.forEach((row, index) => {
      const b = row.booking;
      console.log(`\n${index + 1}. Réservation #${b.id}`);
      console.log(`   Status: ${b.status}`);
      console.log(`   Motif: ${b.cancellationReason || 'AUCUN MOTIF'}`);
      console.log(`   Annulée par: ${b.cancelledBy || 'NON DÉFINI'}`);
      console.log(`   Date annulation: ${b.cancelledAt || 'NON DÉFINIE'}`);
      
      if (row.cancelledByUser) {
        console.log(`   Nom annuleur: ${row.cancelledByUser.name} (${row.cancelledByUser.role})`);
      } else {
        console.log(`   Annuleur: Information non trouvée`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testCancellationData().then(() => {
  console.log('\n✅ Test terminé');
  process.exit(0);
}).catch((error) => {
  console.error('Erreur critique:', error);
  process.exit(1);
});