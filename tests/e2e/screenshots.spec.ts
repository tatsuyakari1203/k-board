import { test, expect } from "@playwright/test";

// robust-selector-playground/tests/e2e/screenshots.spec.ts but for K-ERP
// Targeting localhost:3000 (Docker or Dev)

test.describe("Marketing Screenshots", () => {
  test.use({
    viewport: { width: 1440, height: 900 }, // Standard Desktop
    locale: "en", // English for international README (or user preference?) Let's use 'vi' as it is primary? User's README is in English features but "K-Board" implies...
    // Let's stick to 'vi' if that's the default or 'en' if README is English.
    // README is mixed. Let's use 'vi' (Vietnamese) as it looks like the primary target audience based on seed data ("Hồ sơ đo đạc").
    // Actually, README has English descriptions.
    // Let's take screenshots in Vietnamese since the UI is localized that way in seed?
    // Wait, the seed data is Vietnamese ("Hồ sơ đo đạc"). So Vietnamese UI matches better.
  });

  test("Capture Landing Page", async ({ page }) => {
    await page.goto("/");
    // Wait for hero to load
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: "public/screenshots/landing.png", fullPage: true });
  });

  test("Capture Dashboard and Kanban", async ({ page }) => {
    // 1. Login
    await page.goto("/auth/login");

    // Use manager credentials from seed (reliable)
    // "admin@k-board.com" might not exist if another admin (e.g. user's own account) exists in DB.
    await page.getByLabel("Email").fill("manager@k-board.com");
    await page.getByLabel("Password").fill("123456");
    await page.getByRole("button", { name: "Login" }).click();

    // Wait for Dashboard (increase timeout for Docker slowness)
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // Handle potential first-time setup or welcome toasts
    // "Chào mừng" might be in a toast.
    // Check for Sidebar instead.
    await expect(page.locator("aside")).toBeVisible();
    await page.waitForTimeout(1000); // Wait for hydration
    await page.screenshot({ path: "public/screenshots/dashboard.png" });

    /*
    // 2. Go to Board (Seed board: "Hồ sơ đo đạc 2024")
    // Navigate via URL to be safe
    // Assuming seed created this board.
    const boardName = "Hồ sơ đo đạc 2024";
    await page.goto("/dashboard/boards");

    // Wait for list to load
    await expect(page.locator(`text=${boardName}`)).toBeVisible({ timeout: 10000 });

    // Click the board
    await page.click(`text=${boardName}`);

    // Wait for Kanban info
    await expect(page.locator("h1")).toContainText(boardName);

    // Wait for generic board content (Table or Kanban)
    // Board header actions should be visible
    await expect(page.getByRole("button", { name: /New|Mới/i })).toBeVisible();
    await page.waitForTimeout(2000); // Allow data to load

    // Take screenshot of Kanban
    await page.screenshot({ path: "public/screenshots/kanban.png" });
    */
  });
});
