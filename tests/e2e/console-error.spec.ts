import { test, expect } from "@playwright/test";

test.describe("Accessibility and Runtime Errors", () => {
  test("should not have console errors on Home Page", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Expect no critical errors
    const criticalErrors = consoleErrors.filter(
      (err) => err.includes("Error:") || err.includes("requires a") // Radix UI errors often valid format
    );

    expect(criticalErrors).toEqual([]);

    // Check if critical elements are present
    await expect(page).toHaveTitle(/K-Board/);
  });

  test("should not have console errors on Login Page", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/auth/login");

    const criticalErrors = consoleErrors.filter(
      (err) => err.includes("Error:") || err.includes("requires a")
    );
    expect(criticalErrors).toEqual([]);
  });
});
