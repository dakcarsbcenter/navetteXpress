import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/schema";

// Lazy init du client Drizzle/Postgres pour éviter l'accès ENV au chargement du module
declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: Sql | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: ReturnType<typeof drizzle> | undefined;
}

let _client: Sql | null = (globalThis as any).__postgresClient ?? null;
let _db: ReturnType<typeof drizzle> | null = (globalThis as any).__drizzleDb ?? null;

function getClient() {
  if (_client) return _client;

  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL n'est pas défini. Veuillez le configurer dans votre environnement.");
  }

  _client = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
  });

  (globalThis as any).__postgresClient = _client;
  return _client;
}

export function getDb() {
  if (_db) return _db;

  _db = drizzle(getClient(), { schema });
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

