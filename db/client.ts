import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

export type Database = NeonDatabase<typeof schema>;

type CachedConnection = { url: string; db: Database; pool: Pool };

const globalConnections = globalThis as typeof globalThis & {
  __moonSpiceDb?: CachedConnection;
};

function configureWebSocket() {
  if (!neonConfig.webSocketConstructor) {
    neonConfig.webSocketConstructor = ws;
  }
}

export function createDatabase(url: string): CachedConnection {
  if (!url) throw new Error("DATABASE_URL is required for this operation");
  configureWebSocket();
  const pool = new Pool({ connectionString: url });
  return { url, pool, db: drizzle(pool, { schema }) };
}

export function getDatabase(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for this operation");
  if (!globalConnections.__moonSpiceDb || globalConnections.__moonSpiceDb.url !== url) {
    globalConnections.__moonSpiceDb = createDatabase(url);
  }
  return globalConnections.__moonSpiceDb.db;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function closeDatabaseConnection(connection: CachedConnection) {
  await connection.pool.end();
}
