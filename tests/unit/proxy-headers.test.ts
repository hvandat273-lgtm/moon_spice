import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { proxy } from "@/proxy";

describe("administrator route security headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows inline style attributes required by Next Image in production without relaxing scripts", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = proxy(new NextRequest("https://shop.example/admin/login"));
    const policy = response.headers.get("content-security-policy") ?? "";

    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  });
});
