import { afterEach, describe, expect, it, vi } from "vitest";

import { getCatalogBackend, getPublicSiteUrl, isCommerceEnabled, isSiteIndexingEnabled } from "@/lib/server/env";

describe("catalog capabilities", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults local development and tests to local JSON", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_MODE", "catalog");
    delete process.env.CATALOG_BACKEND;
    delete process.env.DATABASE_URL;
    delete process.env.VERCEL;
    expect(getCatalogBackend()).toBe("local-json");
  });

  it("fails closed on Vercel when the catalog backend is missing", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DEPLOYMENT_MODE", "catalog");
    delete process.env.CATALOG_BACKEND;
    delete process.env.DATABASE_URL;
    expect(getCatalogBackend()).toBeNull();
  });

  it("never enables commerce for a JSON catalog", () => {
    vi.stubEnv("DEPLOYMENT_MODE", "catalog");
    vi.stubEnv("CATALOG_BACKEND", "vercel-blob");
    delete process.env.DATABASE_URL;
    expect(isCommerceEnabled()).toBe(false);
  });

  it("never enables commerce even when legacy database variables are present", () => {
    vi.stubEnv("DEPLOYMENT_MODE", "production");
    vi.stubEnv("CATALOG_BACKEND", "postgres");
    vi.stubEnv("DATABASE_URL", "postgresql://example.invalid/moor_spice");
    vi.stubEnv("COMMERCIAL_HOSTING_CONFIRMED", "true");
    expect(isCommerceEnabled()).toBe(false);
  });

  it("only enables search indexing through an explicit HTTPS configuration", () => {
    vi.stubEnv("SITE_INDEXING_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(isSiteIndexingEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://moor-spice.example");
    expect(isSiteIndexingEnabled()).toBe(true);
  });

  it("falls back to the Vercel hostname when NEXT_PUBLIC_SITE_URL is blank", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "moor-spice.vercel.app");
    expect(getPublicSiteUrl().toString()).toBe("https://moor-spice.vercel.app/");
  });

  it("does not crash metadata when an optional public URL is malformed", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "://invalid");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getPublicSiteUrl().toString()).toBe("http://localhost:3000/");
  });
});
