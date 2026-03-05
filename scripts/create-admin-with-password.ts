import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users } from "../src/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Load environment variables from .env.local and .env
config({ path: ".env.local" });
config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(DATABASE_URL);
const db = drizzle({ client: sql });

async function createAdminUser() {
  const email = "admin@taxi-service.com";
  const password = "Admin123!"; // Changez ce mot de passe!
  const name = "Admin Principal";

  try {
    console.log("🔐 Création de l'utilisateur admin...");
    
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Mettre à jour le mot de passe de l'utilisateur existant
      console.log("👤 Utilisateur existant trouvé, mise à jour du mot de passe...");
      await db
        .update(users)
        .set({
          password: hashedPassword,
          isActive: true,
          loginAttempts: 0,
          accountLockedUntil: null,
          updatedAt: new Date()
        })
        .where(eq(users.email, email));
      
      console.log("✅ Mot de passe mis à jour!");
    } else {
      // Créer un nouvel utilisateur
      console.log("➕ Création d'un nouvel utilisateur admin...");
      await db.insert(users).values({
        id: randomUUID(),
        email,
        password: hashedPassword,
        name,
        role: "admin",
        isActive: true,
        phone: "+33123456789",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("✅ Utilisateur admin créé!");
    }

    console.log("\n🎉 Configuration terminée!");
    console.log("📧 Email:", email);
    console.log("🔑 Mot de passe:", password);
    console.log("\n⚠️  N'oubliez pas de changer le mot de passe après votre première connexion!");

  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  }
}

createAdminUser()
  .then(() => {
    console.log("\n✨ Script terminé avec succès!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
