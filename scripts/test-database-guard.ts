export interface TestDatabaseGuardRecord {
  environment: "DEVELOPMENT" | "TEST" | "PREVIEW" | "PRODUCTION";
  instanceId: string;
}

export interface TestDatabaseGuardInput {
  allowReset: string | undefined;
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
  targetUrl: string | undefined;
  testInstanceId: string | undefined;
  productionInstanceId: string | undefined;
  productionDatabaseHost?: string;
  runtimeDatabaseUrl?: string;
  migrationDatabaseUrl?: string;
}

function requireUuid(value: string | undefined, name: string): string {
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${name} must be a valid UUID`);
  }
  return value.toLowerCase();
}

function parsePostgresUrl(value: string | undefined, name: string): URL {
  if (!value) throw new Error(`${name} is required`);
  const parsed = new URL(value);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) throw new Error(`${name} must be a PostgreSQL URL`);
  return parsed;
}

function normalizedHost(value: string): string {
  return value.toLowerCase().replace(/-pooler(?=\.)/, "");
}

function sameDatabase(left: URL, right: URL): boolean {
  return normalizedHost(left.hostname) === normalizedHost(right.hostname)
    && left.port === right.port
    && left.pathname === right.pathname;
}

export function assertTestDatabaseResetAllowed(input: TestDatabaseGuardInput, records: readonly TestDatabaseGuardRecord[]): void {
  if (input.allowReset !== "true") throw new Error("ALLOW_TEST_DATABASE_RESET=true is required");
  if (input.nodeEnv === "production" || input.vercelEnv === "production") throw new Error("Test database reset is forbidden in production runtime");

  const target = parsePostgresUrl(input.targetUrl, "DATABASE_URL_TEST_UNPOOLED");
  if (target.hostname.includes("-pooler")) throw new Error("Test reset requires a direct, unpooled database URL");
  const testInstanceId = requireUuid(input.testInstanceId, "TEST_DATABASE_INSTANCE_ID");
  const productionInstanceId = requireUuid(input.productionInstanceId, "PRODUCTION_DATABASE_INSTANCE_ID");
  if (testInstanceId === productionInstanceId) throw new Error("Test and production database instance IDs must differ");
  if (records.length !== 1 || records[0].environment !== "TEST" || records[0].instanceId.toLowerCase() !== testInstanceId) {
    throw new Error("DatabaseEnvironmentGuard does not identify the target as the expected TEST database");
  }

  if (input.productionDatabaseHost && normalizedHost(target.hostname) === normalizedHost(input.productionDatabaseHost)) {
    throw new Error("Test database host matches the protected production host");
  }
  for (const [name, value] of [["DATABASE_URL", input.runtimeDatabaseUrl], ["DATABASE_URL_UNPOOLED", input.migrationDatabaseUrl]] as const) {
    if (!value) continue;
    const candidate = parsePostgresUrl(value, name);
    if (sameDatabase(target, candidate)) throw new Error(`Test database target matches ${name}`);
  }
}
