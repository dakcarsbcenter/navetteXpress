// Script pour créer des données de test réalistes pour Alain Petit
import { db } from './src/db.js';
import { users, bookingsTable, reviewsTable } from './src/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const createTestData = async () => {
  try {
    console.log('🔄 Création des données de test pour Alain Petit...\n');

    // 1. Créer ou récupérer l'utilisateur Alain Petit
    let driver = await db.select().from(users).where(eq(users.email, 'alain.petit@navetteXpress.com')).limit(1);
    
    if (driver.length === 0) {
      console.log('👤 Création du chauffeur Alain Petit...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      await db.insert(users).values({
        id: 'alain-petit-driver',
        name: 'Alain Petit',
        email: 'alain.petit@navetteXpress.com',
        password: hashedPassword,
        role: 'driver',
        phone: '+33 6 12 34 56 78',
        licenseNumber: 'FR123456789',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      driver = [{ id: 'alain-petit-driver', name: 'Alain Petit', email: 'alain.petit@navetteXpress.com' }];
      console.log('✅ Chauffeur Alain Petit créé');
    } else {
      console.log('👤 Chauffeur Alain Petit trouvé');
    }

    const driverId = driver[0].id;

    // 2. Créer des réservations réalistes pour ce mois
    console.log('📅 Création des réservations...');
    
    const bookings = [
      {
        customerName: 'Marie Dubois',
        customerEmail: 'marie.dubois@email.com',
        customerPhone: '+33 6 11 22 33 44',
        pickupAddress: 'Gare de Lyon, Paris',
        dropoffAddress: 'Aéroport Charles de Gaulle',
        scheduledDateTime: new Date('2024-12-20T08:00:00'),
        status: 'completed',
        driverId: driverId,
        price: '65.00'
      },
      {
        customerName: 'Jean Martin',
        customerEmail: 'jean.martin@email.com',
        customerPhone: '+33 6 55 66 77 88',
        pickupAddress: 'Place de la Bastille, Paris',
        dropoffAddress: 'Gare du Nord, Paris',
        scheduledDateTime: new Date('2024-12-20T14:30:00'),
        status: 'completed',
        driverId: driverId,
        price: '25.00'
      },
      {
        customerName: 'Sophie Laurent',
        customerEmail: 'sophie.laurent@email.com',
        customerPhone: '+33 6 99 88 77 66',
        pickupAddress: 'Châtelet-Les Halles, Paris',
        dropoffAddress: 'Défense, Paris',
        scheduledDateTime: new Date('2024-12-21T09:15:00'),
        status: 'completed',
        driverId: driverId,
        price: '35.00'
      },
      {
        customerName: 'Pierre Durand',
        customerEmail: 'pierre.durand@email.com',
        customerPhone: '+33 6 44 55 66 77',
        pickupAddress: 'Opéra, Paris',
        dropoffAddress: 'Orly, Paris',
        scheduledDateTime: new Date('2024-12-21T16:45:00'),
        status: 'completed',
        driverId: driverId,
        price: '55.00'
      },
      {
        customerName: 'Isabelle Moreau',
        customerEmail: 'isabelle.moreau@email.com',
        customerPhone: '+33 6 33 22 11 00',
        pickupAddress: 'Montparnasse, Paris',
        dropoffAddress: 'Versailles',
        scheduledDateTime: new Date('2024-12-22T10:20:00'),
        status: 'completed',
        driverId: driverId,
        price: '45.00'
      }
    ];

    for (const booking of bookings) {
      await db.insert(bookingsTable).values({
        ...booking,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('✅ 5 réservations créées');

    // 3. Créer des avis clients
    console.log('⭐ Création des avis...');
    
    // Récupérer les IDs des réservations créées
    const completedBookings = await db.select()
      .from(bookingsTable)
      .where(and(eq(bookingsTable.driverId, driverId), eq(bookingsTable.status, 'completed')))
      .limit(5);

    const reviews = [
      { rating: 5, comment: 'Excellent chauffeur, très professionnel et ponctuel!' },
      { rating: 4, comment: 'Très bon service, conduite souple et sécurisée.' },
      { rating: 5, comment: 'Parfait! Alain est très sympa et connaît bien la ville.' },
      { rating: 4, comment: 'Service de qualité, je recommande vivement.' },
      { rating: 5, comment: 'Impeccable comme toujours avec Alain!' }
    ];

    for (let i = 0; i < completedBookings.length && i < reviews.length; i++) {
      const booking = completedBookings[i];
      const review = reviews[i];
      
      await db.insert(reviewsTable).values({
        bookingId: booking.id,
        customerId: 'customer-' + (i + 1), // IDs fictifs
        driverId: driverId,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date()
      });
    }

    console.log('✅ 5 avis créés');

    console.log('\n🎉 Données de test créées avec succès!');
    console.log(`📊 Statistiques pour Alain Petit:`);
    console.log(`- 5 courses complétées`);
    console.log(`- ${bookings.reduce((sum, b) => sum + parseFloat(b.price), 0)} FCFA de revenus`);
    console.log(`- Note moyenne: ${reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length}/5`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
};

createTestData();