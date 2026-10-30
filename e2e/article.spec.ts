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

test.describe("Article detail", () => {
  test("opens from Stories in the same tab with the magazine header", async ({ page }) => {
    await page.goto("/stories");

    const card = page.locator("main a[href^='/stories/']").first();
    const href = await card.getAttribute("href");
    expect(href).toBeTruthy();

    await card.click();

    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("article header")).toContainText("Oleh Redaksi Melodi Alam");
    await expect(page.locator("article header")).not.toContainText("menit");
    await expect(page.locator(".article-prose")).toBeVisible();
  });
});
