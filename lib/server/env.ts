import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDatabase } from "@/db/client";
import { databaseEnvironmentGuards } from "@/db/schema";

const deploymentModeSchema = z.enum(["demo", "catalog", "production"]);
const catalogBackendSchema = z.enum(["local-json", "vercel-blob", "postgres"]);

export type DeploymentMode = z.infer<typeof deploymentModeSchema>;
export type CatalogBackend = z.infer<typeof catalogBackendSchema>;

function readDeploymentMode(): DeploymentMode {
  // A missing flag must never enable commerce or load fixture data. Catalog is
  // the official fail-closed default; `demo` remains only for old test config.
  return deploymentModeSchema.parse(process.env.DEPLOYMENT_MODE ?? "catalog");
}

export function getDeploymentMode(): DeploymentMode {
  return readDeploymentMode();
}

export function isDemoDeployment(): boolean {
  // Backwards-compatible name used by order routes: catalog-only deployments
  // must reject commerce exactly like the former demo mode.
  return getDeploymentMode() !== "production";
}

/**
 * Returns the configured catalog persistence adapter.
 *
 * DATABASE_URL remains a backwards-compatible way to select PostgreSQL. A
 * missing backend is deliberately not treated as fixture/demo data: callers
 * can show an actionable configuration state instead of exposing a fake admin.
 */
export function getCatalogBackend(): CatalogBackend | null {
  const configured = process.env.CATALOG_BACKEND?.trim();
  if (configured) {
    const backend = catalogBackendSchema.parse(configured);
    if (backend === "local-json" && process.env.VERCEL) return null;
    return backend;
  }
  if (process.env.DATABASE_URL?.trim()) return "postgres";
  if (process.env.VERCEL || readDeploymentMode() === "production") return null;
  return "local-json";
}

export function requireCatalogBackend(): CatalogBackend {
  const backend = getCatalogBackend();
  if (!backend) {
    throw new Error("CATALOG_BACKEND is required (local-json, vercel-blob or postgres)");
  }
  return backend;
}

export function hasCatalogBackend(): boolean {
  return getCatalogBackend() !== null;
}

export function usesJsonCatalogBackend(): boolean {
  const backend = getCatalogBackend();
  return backend === "local-json" || backend === "vercel-blob";
}

export function usesPostgresCatalogBackend(): boolean {
  return getCatalogBackend() === "postgres";
}

export function usesSqliteCommerce(): boolean {
  return false;
}

/** This project is intentionally a product catalogue and never accepts orders. */
export function isCommerceEnabled(): boolean {
  return false;
}

/** Publishing/indexing is explicit and independent from accepting orders. */
export function isSiteIndexingEnabled(): boolean {
  if (process.env.SITE_INDEXING_ENABLED !== "true") return false;
  try {
    return getPublicSiteUrl().protocol === "https:";
  } catch {
    return false;
  }
}

export function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function requireSecret(name: "SESSION_SECRET" | "ORDER_ACCESS_SECRET" | "RATE_LIMIT_SECRET" | "CRON_SECRET" | "HEALTHCHECK_SECRET"): string {
  const value = requireEnvironment(name);
  if (Buffer.byteLength(value, "utf8") < 32) throw new Error(`${name} must contain at least 32 bytes`);
  return value;
}

export function assertProductionEnvironment(): void {
  // Catalog deployments do not require a transactional database. Production
  // safety for the private catalog store and administrator access is checked
  // by the authenticated readiness endpoint instead.
}

export async function assertProductionDatabaseIdentity(): Promise<void> {
  if (!isCommerceEnabled()) return;
  assertProductionEnvironment();
  const expectedInstanceId = requireEnvironment("PRODUCTION_DATABASE_INSTANCE_ID").toLowerCase();
  const guards = await getDatabase()
    .select({ environment: databaseEnvironmentGuards.environment, instanceId: databaseEnvironmentGuards.instanceId })
    .from(databaseEnvironmentGuards)
    .where(eq(databaseEnvironmentGuards.singleton, true))
    .limit(2);
  if (guards.length !== 1 || guards[0].environment !== "PRODUCTION" || guards[0].instanceId.toLowerCase() !== expectedInstanceId) {
    throw new Error("DATABASE_URL does not match the expected PRODUCTION DatabaseEnvironmentGuard");
  }
}

export function getPublicSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHostname = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
    || process.env.VERCEL_URL?.trim();
  const candidates = [
    configured,
    vercelHostname
      ? (/^https?:\/\//i.test(vercelHostname) ? vercelHostname : `https://${vercelHostname}`)
      : undefined,
    "http://localhost:3000",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") return url;
    } catch {
      // Public metadata must never take down a page because an optional
      // environment variable is blank or malformed. Try the platform URL,
      // then the local development fallback.
    }
  }

  return new URL("http://localhost:3000");
}
