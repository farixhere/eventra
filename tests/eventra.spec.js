import { test, expect } from "@playwright/test";

const baseURL = process.env.EVENTRA_BASE_URL || "https://eventra-ruddy.vercel.app";
const adminPassword = process.env.EVENTRA_ADMIN_PASSWORD;

test.describe("Eventra production smoke tests", () => {
  test("public Eventra site loads", async ({ page }) => {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Eventra/i);
  });

  test("organiser can open the ID Cards section", async ({ page }) => {
    test.skip(!adminPassword, "EVENTRA_ADMIN_PASSWORD is not configured");

    await page.goto(baseURL + "/admin-login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Admin password").fill(adminPassword);
    await page.getByRole("button", { name: "Enter Control Center" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("button", { name: "ID Cards" }).first().click();

    await expect(page.getByRole("heading", { name: "ID Cards" })).toBeVisible();
    await expect(page.getByText("Create organiser-issued ID card records for event participants.")).toBeVisible();
  });
});
