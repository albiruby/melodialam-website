import { expect, test } from "@playwright/test";

test("welcome modal opens once and closes", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("melodi-welcome-2026-10");
    } catch {
      // Storage is optional in the test browser.
    }
  });

  await page.goto("/");

  const dialog = page.locator("dialog.welcome-dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Tutup" }).click();
  await expect(dialog).not.toBeVisible();

  expect(await page.evaluate(() => localStorage.getItem("melodi-welcome-2026-10"))).toBe("1");
});
