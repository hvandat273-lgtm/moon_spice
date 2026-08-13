import { sql } from "drizzle-orm";

import { databaseEnvironmentGuards } from "../db/schema";
import { closeDatabaseConnection, createDatabase } from "../db/client";
import { assertTestDatabaseResetAllowed } from "./test-database-guard";

const targetUrl = process.env.DATABASE_URL_TEST_UNPOOLED;
if (!targetUrl) throw new Error("DATABASE_URL_TEST_UNPOOLED is required");

const connection = createDatabase(targetUrl);
try {
  const guards = await connection.db
    .select({ environment: databaseEnvironmentGuards.environment, instanceId: databaseEnvironmentGuards.instanceId })
    .from(databaseEnvironmentGuards);

  assertTestDatabaseResetAllowed({
    allowReset: process.env.ALLOW_TEST_DATABASE_RESET,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    targetUrl,
    testInstanceId: process.env.TEST_DATABASE_INSTANCE_ID,
    productionInstanceId: process.env.PRODUCTION_DATABASE_INSTANCE_ID,
    productionDatabaseHost: process.env.PRODUCTION_DATABASE_HOST,
    runtimeDatabaseUrl: process.env.DATABASE_URL,
    migrationDatabaseUrl: process.env.DATABASE_URL_UNPOOLED,
  }, guards);

  await connection.db.execute(sql.raw(`
    truncate table
      admin_sessions,
      audit_logs,
      blob_cleanup_jobs,
      order_items,
      orders,
      product_usage_suggestions,
      product_images,
      product_variants,
      reviews,
      products,
      categories,
      site_settings,
      rate_limit_buckets,
      admins
    restart identity cascade
  `));
  console.log("Test database reset completed after all fail-closed checks passed.");
} finally {
  await closeDatabaseConnection(connection);
}
