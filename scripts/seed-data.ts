import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, vehiclesTable, bookingsTable, reviewsTable } from "../src/schema";
import { eq } from "drizzle-orm";

// Configuration de la base de données
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);
const db = drizzle({ client: sql });

// ID utilisateur de base fourni
const baseUserId = "25cf573e-b8a1-497f-95a0-bece51939807";

// Données des utilisateurs
const usersData = [
  // 1 Admin
  {
    id: baseUserId,
    name: "Admin Principal",
    email: "admin@taxi-service.com",
    role: "admin" as const,
    phone: "+33123456789",
    licenseNumber: null,
    isActive: true
  },
  // 9 Chauffeurs
  {
    id: "chauffeur-001",
    name: "Pierre Dubois",
    email: "pierre.dubois@taxi-service.com",
    role: "chauffeur" as const,
    phone: "+33123456790",
    licenseNumber: "LIC001234",
    isActive: true
  },
  {
    id: "chauffeur-002", 
    name: "Marie Martin",
    email: "marie.martin@taxi-service.com",
    role: "chauffeur" as const,
    phone: "+33123456791",
    licenseNumber: "LIC001235",
    isActive: true
  },
  {
    id: "chauffeur-003",
    name: "Jean Bernard",
    email: "jean.bernard@taxi-service.com", 
    role: "chauffeur" as const,
    phone: "+33123456792",
    licenseNumber: "LIC001236",
    isActive: true
  },
  {
    id: "chauffeur-004",
    name: "Sophie Laurent",
    email: "sophie.laurent@taxi-service.com",
    role: "chauffeur" as const, 
    phone: "+33123456793",
    licenseNumber: "LIC001237",
    isActive: true
  },
  {
    id: "chauffeur-005",
    name: "Michel Roux",
    email: "michel.roux@taxi-service.com",
    role: "chauffeur" as const,
    phone: "+33123456794", 
    licenseNumber: "LIC001238",
    isActive: true
  },
  {
    id: "chauffeur-006",
    name: "Isabelle Moreau",
    email: "isabelle.moreau@taxi-service.com",
    role: "chauffeur" as const,
    phone: "+33123456795",
    licenseNumber: "LIC001239",
    isActive: true
  },
  {
    id: "chauffeur-007",
    name: "Alain Petit",
    email: "alain.petit@taxi-service.com",
    role: "chauffeur" as const,
    phone: "+33123456796",
    licenseNumber: "LIC001240",
    isActive: true
  },
  {
    id: "chauffeur-008",
    name: "Nathalie Simon",
    email: "nathalie.simon@taxi-service.com",
    role: "chauffeur" as const,
    phone: "+33123456797",
    licenseNumber: "LIC001241",
    isActive: true
  },
  {
    id: "chauffeur-009",
    name: "Philippe Durand",
    email: "philippe.durand@taxi-service.com",
    role: "chauffeur" as const,
    phone: "+33123456798",
    licenseNumber: "LIC001242",
    isActive: true
  }
];

// Données des véhicules
const vehiclesData = [
  // Véhicules pour les chauffeurs
  {
    make: "Peugeot",
    model: "308",
    year: 2022,
    plateNumber: "AB-123-CD",
    capacity: 4,
    vehicleType: "sedan" as const,
    driverId: "chauffeur-001",
    isActive: true
  },
  {
    make: "Renault",
    model: "Clio",
    year: 2021,
    plateNumber: "EF-456-GH",
    capacity: 4,
    vehicleType: "sedan" as const, 
    driverId: "chauffeur-002",
    isActive: true
  },
  {
    make: "Citroën",
    model: "C4",
    year: 2023,
    plateNumber: "IJ-789-KL",
    capacity: 4,
    vehicleType: "sedan" as const,
    driverId: "chauffeur-003",
    isActive: true
  },
  {
    make: "BMW",
    model: "X5",
    year: 2022,
    plateNumber: "MN-012-OP",
    capacity: 5,
    vehicleType: "suv" as const,
    driverId: "chauffeur-004",
    isActive: true
  },
  {
    make: "Mercedes",
    model: "E-Class",
    year: 2023,
    plateNumber: "QR-345-ST",
    capacity: 4,
    vehicleType: "luxury" as const,
    driverId: "chauffeur-005",
    isActive: true
  },
  {
    make: "Volkswagen",
    model: "Golf",
    year: 2021,
    plateNumber: "UV-678-WX",
    capacity: 4,
    vehicleType: "sedan" as const,
    driverId: "chauffeur-006",
    isActive: true
  },
  {
    make: "Audi",
    model: "A4",
    year: 2022,
    plateNumber: "YZ-901-AB",
    capacity: 4,
    vehicleType: "luxury" as const,
    driverId: "chauffeur-007",
    isActive: true
  },
  {
    make: "Ford",
    model: "Transit",
    year: 2021,
    plateNumber: "CD-234-EF",
    capacity: 8,
    vehicleType: "van" as const,
    driverId: "chauffeur-008",
    isActive: true
  },
  {
    make: "Toyota",
    model: "Prius",
    year: 2023,
    plateNumber: "GH-567-IJ",
    capacity: 4,
    vehicleType: "sedan" as const,
    driverId: "chauffeur-009",
    isActive: true
  }
];

// Fonction pour générer des données de réservation
function generateBookingData(customerIndex: number, driverId: string, vehicleId: number) {
  const addresses = [
    "123 Rue de la Paix, Dakar",
    "456 Avenue des Champs-Élysées, Dakar", 
    "789 Boulevard Saint-Germain, Dakar",
    "321 Rue de Rivoli, Dakar",
    "654 Place de la République, Dakar",
    "987 Rue du Faubourg Saint-Antoine, Dakar",
    "147 Avenue Montaigne, Dakar",
    "258 Rue de la Roquette, Dakar",
    "369 Boulevard Haussmann, Dakar",
    "741 Rue de la Sorbonne, Dakar"
  ];
  
  const statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"] as const;
  const notes = [
    "Client préfère la climatisation",
    "Bagages volumineux",
    "Arrêt à la pharmacie en route",
    "Client malentendant",
    "Trajet express",
    "Arrêt pour cigarettes",
    "Client avec animal",
    "Trajet touristique",
    "Client âgé - conduite douce",
    "Trajet d'affaires"
  ];

  const pickupAddress = addresses[Math.floor(Math.random() * addresses.length)];
  let dropoffAddress = addresses[Math.floor(Math.random() * addresses.length)];
  while (dropoffAddress === pickupAddress) {
    dropoffAddress = addresses[Math.floor(Math.random() * addresses.length)];
  }

  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 30) + 1);
  scheduledDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);

  return {
    customerName: `Client ${customerIndex}`,
    customerEmail: `client${customerIndex}@example.com`,
    customerPhone: `+3312345${String(customerIndex).padStart(4, '0')}`,
    userId: baseUserId,
    pickupAddress,
    dropoffAddress,
    scheduledDateTime: scheduledDate,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    driverId,
    vehicleId,
    price: (Math.random() * 50 + 10).toFixed(2),
    notes: notes[Math.floor(Math.random() * notes.length)]
  };
}

// Fonction pour générer des avis
function generateReviewData(bookingId: number, customerId: string, driverId: string) {
  const comments = [
    "Excellent service, chauffeur très professionnel",
    "Très ponctuel et courtois",
    "Véhicule propre et confortable",
    "Service impeccable, je recommande",
    "Chauffeur sympathique et compétent",
    "Trajet agréable, merci beaucoup",
    "Service de qualité, à refaire",
    "Très satisfait du service",
    "Chauffeur expérimenté et rassurant",
    "Excellent rapport qualité-prix"
  ];

  return {
    bookingId,
    customerId,
    driverId,
    rating: Math.floor(Math.random() * 5) + 1,
    comment: comments[Math.floor(Math.random() * comments.length)]
  };
}

async function seedDatabase() {
  try {
    console.log("🌱 Début du seeding de la base de données...");

    // 1. Insérer les utilisateurs
    console.log("👥 Insertion des utilisateurs...");
    for (const user of usersData) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // 2. Insérer les véhicules
    console.log("🚗 Insertion des véhicules...");
    const insertedVehicles = [];
    for (const vehicle of vehiclesData) {
      const result = await db.insert(vehiclesTable).values(vehicle).returning();
      insertedVehicles.push(result[0]);
    }

    // 3. Insérer les réservations (5 par utilisateur)
    console.log("📋 Insertion des réservations...");
    const insertedBookings = [];
    const drivers = usersData.filter(u => u.role === "chauffeur");
    
    for (let i = 0; i < 50; i++) { // 5 réservations par chauffeur (9 chauffeurs)
      const driver = drivers[i % drivers.length];
      const vehicle = insertedVehicles.find(v => v.driverId === driver.id);
      
      if (vehicle) {
        const booking = generateBookingData(i + 1, driver.id, vehicle.id);
        const result = await db.insert(bookingsTable).values(booking).returning();
        insertedBookings.push(result[0]);
      }
    }

    // 4. Insérer les avis (pour les réservations complétées)
    console.log("⭐ Insertion des avis...");
    const completedBookings = insertedBookings.filter(b => b.status === "completed");
    
    for (const booking of completedBookings) {
      const review = generateReviewData(booking.id, baseUserId, booking.driverId);
      await db.insert(reviewsTable).values(review);
    }

    console.log("✅ Seeding terminé avec succès!");
    console.log(`📊 Statistiques:`);
    console.log(`   - ${usersData.length} utilisateurs créés`);
    console.log(`   - ${insertedVehicles.length} véhicules créés`);
    console.log(`   - ${insertedBookings.length} réservations créées`);
    console.log(`   - ${completedBookings.length} avis créés`);

  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  }
}

// Exécuter le seeding
seedDatabase()
  .then(() => {
    console.log("🎉 Script terminé avec succès!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
