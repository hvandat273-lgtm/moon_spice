import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 767, height: 900 },
  { width: 768, height: 900 },
  { width: 844, height: 390 },
  { width: 1023, height: 768 },
  { width: 1024, height: 768 },
  { width: 1279, height: 900 },
  { width: 1280, height: 900 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const;

async function loadHero(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#pasta-magic")).toBeVisible();
  await expect(page.locator("#hero-title")).toHaveAccessibleName("MOOR SPICE");
}

test("hero stays contained across the supported viewport matrix", async ({ page }) => {
  test.setTimeout(120_000);

  for (const viewport of viewports) {
    await loadHero(page, viewport);

    const geometry = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>("#pasta-magic");
      const title = document.querySelector<HTMLElement>("#hero-title");
      const ledger = title?.nextElementSibling as HTMLElement | null;
      const cta = hero?.querySelector<HTMLElement>('a[href="#ingredients"]');
      if (!hero || !title || !ledger || !cta) return null;

      const toObject = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        return { bottom: rect.bottom, height: rect.height, left: rect.left, right: rect.right, top: rect.top, width: rect.width };
      };

      return {
        cta: toObject(cta),
        hero: toObject(hero),
        ledger: toObject(ledger),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        title: toObject(title),
      };
    });

    expect(geometry, `hero markup missing at ${viewport.width}x${viewport.height}`).not.toBeNull();
    if (!geometry) continue;
    expect(geometry.overflow, `horizontal overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);

    for (const [name, rect] of Object.entries({ title: geometry.title, ledger: geometry.ledger, cta: geometry.cta })) {
      expect(rect.width, `${name} has no width at ${viewport.width}x${viewport.height}`).toBeGreaterThan(0);
      expect(rect.left, `${name} leaves the left edge at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(-1);
      expect(rect.right, `${name} leaves the right edge at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(viewport.width + 1);
      expect(rect.top, `${name} starts above the hero at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(geometry.hero.top - 1);
      expect(rect.bottom, `${name} ends below the hero at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(geometry.hero.bottom + 1);
    }
  }
});

test("header and wordmark cross the desktop breakpoint without a size jump", async ({ page }) => {
  await loadHero(page, { width: 1023, height: 768 });
  await expect(page.getByRole("banner").locator("details")).toBeVisible();
  await expect(page.getByRole("banner").locator('[class*="desktopNav"]')).toBeHidden();
  const before = await page.locator("#hero-title").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

  await loadHero(page, { width: 1024, height: 768 });
  await expect(page.getByRole("banner").locator("details")).toBeHidden();
  await expect(page.getByRole("banner").locator('[class*="desktopNav"]')).toBeVisible();
  const after = await page.locator("#hero-title").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

  expect(Math.abs(after - before)).toBeLessThan(2);
});

test("mobile menu attaches to the header at every compact width", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 767, height: 900 },
    { width: 1023, height: 768 },
  ]) {
    await loadHero(page, viewport);
    await page.locator("header details > summary").click();

    const header = page.getByRole("banner");
    const panel = header.locator('[class*="mobileMenuPanel"]');
    await expect(panel).toBeVisible();
    const [headerBox, panelBox] = await Promise.all([header.boundingBox(), panel.boundingBox()]);
    expect(headerBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    if (!headerBox || !panelBox) continue;

    expect(Math.abs(panelBox.y - (headerBox.y + headerBox.height))).toBeLessThanOrEqual(1);
    expect(panelBox.x).toBeLessThanOrEqual(1);
    expect(panelBox.width).toBeGreaterThanOrEqual(viewport.width - 2);
    await expect(panel.locator("nav a")).toHaveCount(4);
  }
});

test("mobile menu closes and current-page navigation returns to the top", async ({ page }) => {
  await loadHero(page, { width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 320));

  const menu = page.getByRole("banner").locator("details");
  const summary = menu.locator("summary");
  await summary.click();
  await expect(menu).toHaveAttribute("open", "");

  await page.getByRole("banner").getByRole("link", { name: /MOOR SPICE/i }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await summary.click();
  await page.mouse.click(385, 839);
  await expect(menu).not.toHaveAttribute("open", "");

  await summary.click();
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
});

test("desktop navigation remains clickable while the page is scrolled", async ({ page }) => {
  await loadHero(page, { width: 1440, height: 900 });
  await page.locator("#ingredients").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  const desktopNav = page.getByRole("banner").locator('[class*="desktopNav"]');
  await desktopNav.locator('a[href="/"]').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await desktopNav.locator('a[href="/about"]').click();
  await expect(page).toHaveURL(/\/about$/);
});

test("English locale translates catalog-backed home copy", async ({ page }) => {
  await loadHero(page, { width: 1440, height: 900 });
  await page.getByRole("button", { name: /English/i }).click();

  await expect(page.locator("#pasta-magic")).toContainText("Pasta Magic Powder");
  await expect(page.locator("#pasta-magic")).toContainText("Water, salt, pasta");
  await expect(page.locator("#featured-title")).toHaveText("Pasta Magic Powder");
  await expect(page.locator("#usage")).not.toContainText("アーリオ・オーリオに");
});

test("hero depth follows a fine pointer and stays still for reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const hero = page.locator("#pasta-magic");
  await expect(hero).toBeVisible();
  const box = await hero.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.3);
  await expect(hero).toHaveAttribute("data-looking", "true");
  await expect.poll(() => hero.evaluate((node) => node.style.getPropertyValue("--hero-shift-x"))).not.toBe("0px");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.7);
  await expect(hero).not.toHaveAttribute("data-looking", "true");
  await expect(hero).not.toHaveCSS("--hero-shift-x", /.+/);
});
