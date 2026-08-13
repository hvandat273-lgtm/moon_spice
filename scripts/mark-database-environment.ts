import { eq } from "drizzle-orm";

import { databaseEnvironmentGuards } from "../db/schema";
import { withDirectDatabase } from "./_database";

const environments = ["DEVELOPMENT", "TEST", "PREVIEW", "PRODUCTION"] as const;
const [rawEnvironment, instanceId, confirmation] = process.argv.slice(2);
const environment = environments.find((value) => value === rawEnvironment?.toUpperCase());

if (!environment || !instanceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(instanceId) || confirmation !== "--confirm") {
  throw new Error("Usage: npm run db:mark-environment -- <DEVELOPMENT|TEST|PREVIEW|PRODUCTION> <instanceUuid> --confirm");
}

await withDirectDatabase(async (db) => {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(databaseEnvironmentGuards).where(eq(databaseEnvironmentGuards.singleton, true)).for("update").limit(1);
    if (existing) {
      if (existing.environment === environment && existing.instanceId === instanceId) return;
      throw new Error(`Database guard is immutable and already identifies ${existing.environment} (${existing.instanceId})`);
    }
    await tx.insert(databaseEnvironmentGuards).values({ singleton: true, environment, instanceId });
  });
});

console.log(`Database marked as ${environment} (${instanceId}).`);
