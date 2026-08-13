import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function expectNoSeriousAccessibilityViolations(page: Page) {
  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js") });
  const violations = await page.evaluate(async () => {
    const axe = (window as typeof window & {
      axe: {
        run: (root: Document) => Promise<{
          violations: Array<{ id: string; impact: string | null; nodes: Array<{ target: unknown }> }>;
        }>;
      };
    }).axe;
    const result = await axe.run(document);
    return result.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) }));
  });
  expect(violations).toEqual([]);
}

test("empty catalog presents the official storefront without demo commerce", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "商品情報を準備しています" })).toBeVisible();
  await expect(page.getByRole("link", { name: "お問い合わせ" }).first()).toBeVisible();
  // The catalogue moved onto the home page, so the header no longer carries a
  // 商品一覧 link. The branded home link is the one navigation affordance that
  // is visible at every width — the rest sits inside a closed <details> menu
  // on phones.
  await expect(page.getByRole("link", { name: "MOOR SPICE — ホーム" })).toBeVisible();
  await expect(page.getByRole("button", { name: /カートを開く/ })).toHaveCount(0);
  await expect(page.getByText(/デモ|demo/i)).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/顧客|電話番号|お届け先/);
});

test("retired catalogue routes redirect home and expose no fabricated products", async ({ page }) => {
  // /products, /products/[slug] and /categories/[slug] are now redirect stubs;
  // the public catalogue lives on the home page.
  for (const route of ["/products", "/products/pasta-magic", "/categories/spice"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
  }
  await expect(page.locator('a[href^="/products/"]')).toHaveCount(0);
  await expect(page.getByText(/イタリアンスパイス OF NO3|ガーリックハーブミックス/)).toHaveCount(0);
});

test("legacy commerce routes are removed", async ({ page, request }) => {
  for (const route of ["/cart", "/checkout", "/track-order", "/order-success/MSP-20260812-ABC123"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
  }
  expect((await request.post("/api/orders", { data: {} })).status()).toBe(404);
  expect((await request.post("/api/checkout/quote", { data: {} })).status()).toBe(404);
});

test("key catalog pages have no serious accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop Chromium covers the semantic audit.");
  // /products is a redirect stub: its client-side navigation tears down the
  // execution context underneath addScriptTag. Audit the real pages instead.
  for (const route of ["/", "/about", "/contact", "/recipes", "/recipes/pasta-magic-aglio-olio", "/faq"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  }
});

test("storefront does not overflow at required responsive widths", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(testInfo.project.name !== "chromium", "One browser project covers the viewport matrix.");

  for (const route of ["/", "/about", "/contact", "/recipes"]) {
    for (const viewport of [
      { width: 320, height: 568 },
      // 375 and 768 sit either side of the layout switches the redesigned
      // sections key off, and were where the card unfurl first pushed the
      // document sideways.
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 1366 },
      { width: 1122, height: 1402 },
      { width: 1440, height: 1200 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      // Scroll-driven animations are widest mid-flight, so a measurement taken
      // only at the top of the page would miss them.
      await page.evaluate(async () => {
        const total = document.documentElement.scrollHeight;
        for (let y = 0; y <= total; y += 400) {
          window.scrollTo(0, y);
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        }
        window.scrollTo(0, 0);
      });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} overflows at ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  }
});
