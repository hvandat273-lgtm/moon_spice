import { describe, expect, it } from "vitest";

import { apiFailure, apiSuccess, parseJsonBody, requestIdFrom } from "@/lib/server/api";
import { AppError } from "@/lib/server/errors";

describe("API response and request boundaries", () => {
  it("marks successful private responses as non-cacheable", async () => {
    const response = apiSuccess({ customer: "redacted" }, "request-private");

    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(response.headers.get("x-request-id")).toBe("request-private");
    await expect(response.json()).resolves.toEqual({
      data: { customer: "redacted" },
      error: null,
      requestId: "request-private",
    });
  });

  it("marks error responses as non-cacheable without exposing implementation details", async () => {
    const response = apiFailure(new AppError(409, "STALE_QUOTE", "Quote changed", { quote: "safe" }), "request-error");

    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: { code: "STALE_QUOTE", message: "Quote changed", fieldErrors: { quote: "safe" } },
      requestId: "request-error",
    });
  });

  it("allows an explicitly public response to opt out of private cache headers", () => {
    const response = apiSuccess({ status: "ok" }, "request-public", { private: false });

    expect(response.headers.has("cache-control")).toBe(false);
    expect(response.headers.has("vary")).toBe(false);
  });

  it("rejects declared and actual JSON bodies over the configured byte limit", async () => {
    const declared = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-length": "17" },
      body: "{}",
    });
    await expect(parseJsonBody(declared, 16)).rejects.toMatchObject({ status: 413, code: "PAYLOAD_TOO_LARGE" });

    const multibyte = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ value: "á".repeat(10) }),
    });
    await expect(parseJsonBody(multibyte, 20)).rejects.toMatchObject({ status: 413, code: "PAYLOAD_TOO_LARGE" });
  });

  it("accepts only bounded request IDs and replaces attacker-controlled values", () => {
    const trusted = requestIdFrom(new Request("http://localhost/api", { headers: { "x-request-id": "req_20260810" } }));
    const replaced = requestIdFrom(new Request("http://localhost/api", { headers: { "x-request-id": "\nsecret" } }));

    expect(trusted).toBe("req_20260810");
    expect(replaced).toMatch(/^[0-9a-f-]{36}$/);
    expect(replaced).not.toContain("secret");
  });
});
