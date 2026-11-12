import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("melodi-welcome-2026-10", "1");
    } catch {
      // Storage is optional in the test browser.
    }
  });
});

test.describe("Discover", () => {
  test("lists the feed and filters by pillar and search", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { level: 1, name: "Discover" })).toBeVisible();

    const tiles = page.locator("main section a[href*='instagram.com']");
    await expect(tiles).toHaveCount(55);
    await expect(page.locator("main section h2")).toHaveCount(4);

    await page.getByRole("button", { name: /^Lirik/ }).click();
    await expect(tiles).toHaveCount(9);
    await expect(page).toHaveURL(/pillar=lirik-kutipan/);
    await expect(page.locator("main section h2")).toHaveCount(1);

    await page.getByRole("searchbox").fill("sheila");
    await expect(tiles).toHaveCount(1);
    await expect(page).toHaveURL(/q=sheila/);

    await page.getByRole("searchbox").fill("zzzzzz");
    await expect(page.getByText("Belum ada post yang cocok.")).toBeVisible();
  });

  test("keeps legacy pillar links inside their new group", async ({ page }) => {
    await page.goto("/discover?pillar=lirik");

    await expect(
      page.locator("main section a[href*='instagram.com']"),
    ).toHaveCount(9);
    await expect(
      page.getByRole("button", { name: /^Lirik & Kutipan/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("narrows the page to one group from the section head", async ({ page }) => {
    await page.goto("/discover");

    await page
      .getByRole("button", { name: "Tampilkan hanya Fakta & Trivia" })
      .click();

    await expect(page).toHaveURL(/pillar=fakta-trivia/);
    await expect(page.locator("main section h2")).toHaveCount(1);
    await expect(
      page.locator("main section a[href*='instagram.com']"),
    ).toHaveCount(18);

    await page.getByRole("button", { name: "Tampilkan semua grup" }).click();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.locator("main section h2")).toHaveCount(4);
  });

  test("keeps /kurasi as a redirect", async ({ page }) => {
    await page.goto("/kurasi");
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByRole("heading", { level: 1, name: "Discover" })).toBeVisible();
  });

  test("uses two columns on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/discover");

    const tiles = page.locator("main section a[href*='instagram.com']");
    const first = await tiles.nth(0).boundingBox();
    const second = await tiles.nth(1).boundingBox();

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (first && second) {
      expect(Math.abs(first.y - second.y)).toBeLessThan(4);
      expect(second.x).toBeGreaterThan(first.x + first.width / 2);
    }
  });
});
