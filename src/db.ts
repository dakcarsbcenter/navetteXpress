import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/schema";

// Lazy init du client Drizzle/Postgres pour éviter l'accès ENV au chargement du module
declare global {
  // eslint-disable-next-line no-var
  var __drizzleDb: ReturnType<typeof drizzle> | undefined;
}

let _db: ReturnType<typeof drizzle> | null = (globalThis as any).__drizzleDb ?? null;

export function getDb() {
  if (_db) return _db;

  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL n'est pas défini. Veuillez le configurer dans votre environnement.");
  }

  const sql = postgres(DATABASE_URL);
  _db = drizzle(sql, { schema });
  (globalThis as any).__drizzleDb = _db;
  return _db;
}

// Compat: garder l'import existant `import { db } from '@/db'` avec un Proxy paresseux
// qui instancie réellement la connexion au premier accès d'une méthode
export const db = new Proxy({} as unknown as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    const real = getDb() as any;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

