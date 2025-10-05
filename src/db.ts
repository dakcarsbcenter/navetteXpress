import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Exige une configuration via les variables d'environnement
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL n'est pas défini. Veuillez le configurer dans votre environnement.");
}

const sql = neon(DATABASE_URL);
export const db = drizzle(sql);
