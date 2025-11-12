import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress",
  },
});
