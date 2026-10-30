import { expect, test } from "@playwright/test";

test.describe("Article detail", () => {
  test("opens from Stories in a new tab with the magazine header", async ({ page, context }) => {
    await page.goto("/stories");

    const card = page.locator("main a[href^='/stories/']").first();
    const [detail] = await Promise.all([context.waitForEvent("page"), card.click()]);

    await detail.waitForLoadState("domcontentloaded");

    await expect(detail.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(detail.locator("article header")).toContainText("Oleh Redaksi Melodi Alam");
    await expect(detail.locator("article header")).not.toContainText("menit");
    await expect(detail.locator(".article-prose")).toBeVisible();
  });
});
