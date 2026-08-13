import { closeDatabaseConnection, createDatabase } from "../db/client";

export async function withDirectDatabase<T>(callback: (database: ReturnType<typeof createDatabase>["db"]) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL_UNPOOLED is required");
  const connection = createDatabase(url);
  try {
    return await callback(connection.db);
  } finally {
    await closeDatabaseConnection(connection);
  }
}
