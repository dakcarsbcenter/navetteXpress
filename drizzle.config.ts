import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env and .env.local
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is not set. Please configure it in .env.local");
}

console.log(`📡 Drizzle Kit using database: ${dbUrl.split('@')[1].split('/')[0]}`);

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
