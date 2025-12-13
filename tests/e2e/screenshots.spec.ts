import { test, expect } from "@playwright/test";

test.describe("Marketing Screenshots Gallery", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
  });

  test("Capture All Pages", async ({ page }) => {
    // 1. Landing Page
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "public/screenshots/landing.png", fullPage: true });
    console.log("📸 Captured Landing");

    // 2. Authentication Pages
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await page.screenshot({ path: "public/screenshots/login.png" });
    console.log("📸 Captured Login");

    await page.goto("/auth/register");
    await expect(page.getByRole("button", { name: /Register|Đăng/i })).toBeVisible();
    await page.screenshot({ path: "public/screenshots/register.png" });
    console.log("📸 Captured Register");

    // 3. Login as Admin
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("admin-test@k-board.com");
    await page.getByLabel("Password").fill("admin123456");
    await page.getByRole("button", { name: "Login" }).click();

    // Wait for Dashboard
    await page.waitForURL("**/dashboard");
    await expect(page.locator("aside")).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "public/screenshots/dashboard.png" });
    console.log("📸 Captured Dashboard");

    // 4. User Profile Dialog
    // UserButton is in the footer (border-t p-4)
    // Click the Settings icon button in that area
    await page.locator(".border-t.p-4 button:has(.lucide-settings)").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.waitForTimeout(500); // Animation
    await page.screenshot({ path: "public/screenshots/profile-dialog.png" });
    console.log("📸 Captured Profile Dialog");
    await page.keyboard.press("Escape"); // Close dialog

    // 5. Boards List
    await page.goto("/dashboard/boards");
    await expect(page.locator("h1")).toContainText("Boards");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "public/screenshots/boards-list.png" });
    console.log("📸 Captured Boards List");

    // 6. Board Details
    const boardName = "Product Roadmap 2024";
    // Navigate via URL to avoid UI flakiness
    await page.goto("/dashboard/boards");
    await page.getByText(boardName).click();
    await expect(page.locator("h1")).toContainText(boardName);

    // 6a. Table View (Default)
    // Wait for table rows to appear
    await expect(page.getByRole("table")).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "public/screenshots/table-view.png" });
    console.log("📸 Captured Table View");

    // 6b. Kanban View switch
    // Switch to Kanban View (if not active)
    // Try to find the tab "Kanban Board" (Seed name)
    const kanbanTab = page.getByText("Kanban Board");
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(1000); // Animation
    }

    // Wait for Kanban Columns
    // "In Progress" should be a column header now
    await expect(page.getByText("In Progress")).toBeVisible();
    await page.waitForTimeout(1000);

    // Ensure "New Task" button is visible
    await expect(page.getByRole("button", { name: /New/i })).toBeVisible();
    await page.screenshot({ path: "public/screenshots/kanban.png" });
    console.log("📸 Captured Kanban");

    // 7. Admin Users
    await page.goto("/dashboard/admin/users");
    // Wait for table
    await expect(page.getByRole("table")).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "public/screenshots/admin-users.png" });
    console.log("📸 Captured Admin Users");

    // 8. Admin Settings
    await page.goto("/dashboard/admin/settings");
    await expect(page.locator("h1")).toContainText("Settings");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "public/screenshots/admin-settings.png" });
    console.log("📸 Captured Admin Settings");
  });
});
