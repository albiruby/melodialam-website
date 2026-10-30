import { expect, test } from "@playwright/test";

test.describe("Discover", () => {
  test("lists the feed and filters by pillar and search", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { level: 1, name: "Discover" })).toBeVisible();

    const tiles = page.locator("main section a[href*='instagram.com']");
    await expect(tiles).toHaveCount(55);

    await page.getByRole("button", { name: /^Lirik/ }).click();
    await expect(tiles).toHaveCount(3);
    await expect(page).toHaveURL(/pillar=lirik/);

    await page.getByRole("searchbox").fill("sheila");
    await expect(tiles).toHaveCount(1);
    await expect(page).toHaveURL(/q=sheila/);

    await page.getByRole("searchbox").fill("zzzzzz");
    await expect(page.getByText("Belum ada post yang cocok.")).toBeVisible();
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
