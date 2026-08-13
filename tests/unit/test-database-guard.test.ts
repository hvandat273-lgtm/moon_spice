import { describe, expect, it } from "vitest";

import { assertTestDatabaseResetAllowed, type TestDatabaseGuardInput } from "../../scripts/test-database-guard";

const testId = "00000000-0000-4000-8000-000000000101";
const productionId = "00000000-0000-4000-8000-000000000102";
const valid: TestDatabaseGuardInput = {
  allowReset: "true",
  nodeEnv: "test",
  vercelEnv: "preview",
  targetUrl: "postgresql://test:secret@test-branch.neon.tech/moon_spice_test",
  testInstanceId: testId,
  productionInstanceId: productionId,
  productionDatabaseHost: "production.neon.tech",
  runtimeDatabaseUrl: "postgresql://dev:secret@dev-pooler.neon.tech/moon_spice_dev",
  migrationDatabaseUrl: "postgresql://dev:secret@dev.neon.tech/moon_spice_dev",
};
const guard = [{ environment: "TEST" as const, instanceId: testId }];

describe("test database reset guard", () => {
  it("accepts only an explicitly enabled, independently identified TEST target", () => {
    expect(() => assertTestDatabaseResetAllowed(valid, guard)).not.toThrow();
  });

  it.each([
    ["missing opt-in", { allowReset: undefined }, guard],
    ["production Node runtime", { nodeEnv: "production" }, guard],
    ["production Vercel runtime", { vercelEnv: "production" }, guard],
    ["missing target URL", { targetUrl: undefined }, guard],
    ["pooled target URL", { targetUrl: "postgresql://test:secret@test-pooler.neon.tech/moon_spice_test" }, guard],
    ["mismatched instance", {}, [{ environment: "TEST" as const, instanceId: productionId }]],
    ["production label", {}, [{ environment: "PRODUCTION" as const, instanceId: testId }]],
    ["preview label", {}, [{ environment: "PREVIEW" as const, instanceId: testId }]],
    ["same production instance", { productionInstanceId: testId }, guard],
    ["same protected host", { productionDatabaseHost: "test-branch.neon.tech" }, guard],
    ["same runtime database", { runtimeDatabaseUrl: "postgresql://runtime:other@test-branch.neon.tech/moon_spice_test" }, guard],
  ])("rejects %s", (_name, patch, records) => {
    expect(() => assertTestDatabaseResetAllowed({ ...valid, ...patch }, records)).toThrow();
  });
});
