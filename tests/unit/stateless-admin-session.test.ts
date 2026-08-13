import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminSessionCookieName,
  getAdminAuthenticationConfigurationIssue,
  loginAdmin,
  readAdminSession,
  setAdminSessionCookie,
} from "@/lib/server/auth";

const now = new Date("2026-08-12T02:00:00.000Z");

function requestWithToken(token: string): Request {
  return new Request("http://localhost:3000/api/admin/session", {
    headers: { cookie: `${adminSessionCookieName()}=${token}` },
  });
}

describe("environment-backed stateless admin sessions", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEPLOYMENT_MODE", "catalog");
    vi.stubEnv("CATALOG_BACKEND", "local-json");
    vi.stubEnv("SESSION_SECRET", "test-session-secret-containing-at-least-thirty-two-bytes");
    vi.stubEnv("ADMIN_EMAIL", "owner@moor-spice.example");
    vi.stubEnv("ADMIN_PASSWORD_HASH", await hash("correct horse battery", 12));
    vi.stubEnv("ADMIN_DISPLAY_NAME", "MOOR SPICE Owner");
    vi.stubEnv("ADMIN_SESSION_VERSION", "1");
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("reports actionable configuration problems instead of creating a fixture principal", () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    expect(getAdminAuthenticationConfigurationIssue()).toContain("ADMIN_EMAIL");
  });

  it("issues a signed two-hour session bound to the credential configuration", async () => {
    const result = await loginAdmin({
      email: "OWNER@MOOR-SPICE.EXAMPLE",
      password: "correct horse battery",
      ip: "127.0.0.1",
    });
    expect(result.expiresAt.getTime() - now.getTime()).toBe(2 * 60 * 60 * 1000);
    await expect(readAdminSession(requestWithToken(result.token))).resolves.toMatchObject({
      email: "owner@moor-spice.example",
      displayName: "MOOR SPICE Owner",
      role: "OWNER",
    });

    vi.stubEnv("ADMIN_SESSION_VERSION", "2");
    await expect(readAdminSession(requestWithToken(result.token))).resolves.toBeNull();
  });

  it("rejects tampering and expiration", async () => {
    const result = await loginAdmin({
      email: "owner@moor-spice.example",
      password: "correct horse battery",
      ip: "127.0.0.1",
    });
    const tampered = `${result.token.slice(0, -1)}${result.token.endsWith("a") ? "b" : "a"}`;
    await expect(readAdminSession(requestWithToken(tampered))).resolves.toBeNull();

    vi.setSystemTime(new Date(now.getTime() + 2 * 60 * 60 * 1000));
    await expect(readAdminSession(requestWithToken(result.token))).resolves.toBeNull();
  });

  it("sets the stateless cookie as HttpOnly, Strict and host-only", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = await loginAdmin({
      email: "owner@moor-spice.example",
      password: "correct horse battery",
      ip: "127.0.0.1",
    });
    const response = NextResponse.json({ ok: true });
    setAdminSessionCookie(response, result.token, result.expiresAt);
    const issued = response.headers.get("set-cookie") ?? "";
    expect(issued).toContain("__Host-moon_spice_admin=");
    expect(issued).toContain("HttpOnly");
    expect(issued).toContain("Secure");
    expect(issued).toContain("SameSite=strict");
    expect(issued).not.toContain("Domain=");
  });
});
