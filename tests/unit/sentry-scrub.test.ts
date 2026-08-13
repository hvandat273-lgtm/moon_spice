import { describe, expect, it } from "vitest";

import { scrubSentryRoute, scrubSentryUrl } from "@/lib/sentry-scrub";

describe("Sentry URL scrubbing", () => {
  it("removes queries from URLs", () => {
    expect(scrubSentryUrl("https://shop.example/products/pasta-magic-powder?ref=campaign"))
      .toBe("https://shop.example/products/pasta-magic-powder");
    expect(scrubSentryRoute("/products/pasta-magic-powder")).toBe("/products/pasta-magic-powder");
  });

  it("preserves non-sensitive static routes", () => {
    expect(scrubSentryRoute("/products/italian-herb-spice")).toBe("/products/italian-herb-spice");
    expect(scrubSentryUrl("not a URL")).toBeUndefined();
  });
});
