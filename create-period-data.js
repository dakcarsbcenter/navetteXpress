// Script pour créer des données avec des dates variées pour tester les périodes
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { bookingsTable, reviewsTable } from "../src/schema.js";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);
const db = drizzle({ client: sql });

const createTestBookings = async () => {
  try {
    console.log('🕒 Création de réservations avec dates variées...\n');

    const now = new Date();
    
    // Réservations pour cette semaine
    const thisWeekBookings = [
      {
        customerName: 'Client Semaine 1',
        customerEmail: 'semaine1@test.com',
        customerPhone: '+33 6 11 11 11 11',
        pickupAddress: 'Gare de Lyon',
        dropoffAddress: 'CDG Terminal 1',
        scheduledDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2), // Il y a 2 jours
        status: 'completed',
        driverId: 'driver-009', // Alain Petit
        price: '45.00',
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
      },
      {
        customerName: 'Client Semaine 2',
        customerEmail: 'semaine2@test.com',
        customerPhone: '+33 6 22 22 22 22',
        pickupAddress: 'Châtelet',
        dropoffAddress: 'Orly Sud',
        scheduledDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), // Hier
        status: 'completed',
        driverId: 'driver-009',
        price: '38.00',
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      }
    ];

    // Réservations pour ce mois (mais pas cette semaine)
    const thisMonthBookings = [
      {
        customerName: 'Client Mois 1',
        customerEmail: 'mois1@test.com',
        customerPhone: '+33 6 33 33 33 33',
        pickupAddress: 'République',
        dropoffAddress: 'Versailles',
        scheduledDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15), // Il y a 15 jours
        status: 'completed',
        driverId: 'driver-009',
        price: '52.00',
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15)
      },
      {
        customerName: 'Client Mois 2',
        customerEmail: 'mois2@test.com',
        customerPhone: '+33 6 44 44 44 44',
        pickupAddress: 'Montparnasse',
        dropoffAddress: 'Roissy',
        scheduledDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10), // Il y a 10 jours
        status: 'completed',
        driverId: 'driver-009',
        price: '67.00',
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10)
      }
    ];

    // Réservations pour cette année (mais pas ce mois)
    const thisYearBookings = [
      {
        customerName: 'Client Année 1',
        customerEmail: 'annee1@test.com',
        customerPhone: '+33 6 55 55 55 55',
        pickupAddress: 'Opéra',
        dropoffAddress: 'Le Bourget',
        scheduledDateTime: new Date(now.getFullYear(), now.getMonth() - 2, 15), // Il y a 2 mois
        status: 'completed',
        driverId: 'driver-009',
        price: '73.00',
        createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 15),
        updatedAt: new Date(now.getFullYear(), now.getMonth() - 2, 15)
      },
      {
        customerName: 'Client Année 2',
        customerEmail: 'annee2@test.com',
        customerPhone: '+33 6 66 66 66 66',
        pickupAddress: 'Bastille',
        dropoffAddress: 'Beauvais',
        scheduledDateTime: new Date(now.getFullYear(), now.getMonth() - 1, 20), // Il y a 1 mois
        status: 'completed',
        driverId: 'driver-009',
        price: '89.00',
        createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 20),
        updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 20)
      }
    ];

    // Insérer toutes les réservations
    const allBookings = [...thisWeekBookings, ...thisMonthBookings, ...thisYearBookings];
    
    for (const booking of allBookings) {
      await db.insert(bookingsTable).values(booking);
    }

    console.log('✅ Réservations créées:');
    console.log(`- Cette semaine: ${thisWeekBookings.length} (${thisWeekBookings.reduce((sum, b) => sum + parseFloat(b.price), 0)} FCFA)`);
    console.log(`- Ce mois: ${thisMonthBookings.length + thisWeekBookings.length} (${[...thisMonthBookings, ...thisWeekBookings].reduce((sum, b) => sum + parseFloat(b.price), 0)} FCFA)`);
    console.log(`- Cette année: ${allBookings.length} (${allBookings.reduce((sum, b) => sum + parseFloat(b.price), 0)} FCFA)`);

    console.log('\n🎉 Test des périodes maintenant possible!');
    console.log('Les boutons "Cette semaine", "Ce mois", "Cette année" afficheront des données différentes.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

createTestBookings();