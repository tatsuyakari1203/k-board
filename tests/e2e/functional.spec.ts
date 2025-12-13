import { test, expect } from "@playwright/test";

const ADMIN_CREDENTIALS = {
  email: "admin-test@k-board.com",
  password: "admin123456",
};

const NEW_USER = {
  name: "Test Walker",
  email: `walker-${Date.now()}@test.com`,
  password: "password123",
};

test.describe("Functional Flows", () => {
  test("I18n: Switch Language updates text", async ({ page }) => {
    await page.goto("/");

    // Check English
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
    await expect(page.getByText("Lean Project Management")).toBeVisible();

    // Switch to Vietnamese
    await page.getByRole("button", { name: "Switch Language" }).click();
    await page.getByText("Tiếng Việt").click();

    // Check Vietnamese
    // Verify URL contains /vi/ or just text update?
    // messages/vi.json: "getStarted": "Bắt đầu ngay"
    await expect(page.getByRole("link", { name: "Bắt đầu ngay" })).toBeVisible();
    // "Lean Project Management" -> "Quản lý dự án tinh gọn" (Expected)
    await expect(page.getByText("Quản lý dự án tinh gọn")).toBeVisible();
  });

  // Note: Registration needs manual approval by default, so we only test success message
  test("Auth: Register new user", async ({ page }) => {
    await page.goto("/auth/register");

    await page.getByPlaceholder("Enter your name").fill(NEW_USER.name); // en.json: enterName
    await page.getByPlaceholder("m@example.com").fill(NEW_USER.email);
    await page.getByLabel("Password", { exact: true }).fill(NEW_USER.password);
    await page.getByLabel("Confirm Password").fill(NEW_USER.password);

    await page.getByRole("button", { name: "Register" }).click();

    // Expecting success toast or redirect to login
    // RegisterForm.tsx: showToast.success(... "registerSuccess") -> router.push("/auth/login")
    // Validation.registerSuccess: "Registration successful! Redirecting..."
    await expect(page.getByText("Registration successful")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("Core: Create a new Board", async ({ page }) => {
    // 1. Login
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(ADMIN_CREDENTIALS.email);
    await page.getByLabel("Password").fill(ADMIN_CREDENTIALS.password);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL(/\/dashboard/);

    // 2. Navigate to Boards
    // Desktop Sidebar
    await page.locator('aside a[href*="/dashboard/boards"]').click();
    await expect(page).toHaveURL(/\/dashboard\/boards/);

    // 3. Click Create Button
    // In client.tsx/page.tsx, identifying the button.
    // Usually "New Board" or "Create Board".
    // en.json: Dashboard.createBoard: "New Board" or Boards.createFirstBoard
    // We'll try finding by text "New Board" or "Create Board"
    const createBtn = page
      .getByRole("button", { name: "New Board" })
      .or(page.getByRole("button", { name: "Create Board" }));
    await createBtn.first().click();

    // 4. Fill Dialog
    await expect(page.getByRole("dialog")).toBeVisible();
    const boardName = `E2E Board ${Date.now()}`;
    await page.getByLabel("Board Name").fill(boardName);
    await page.getByLabel("Description").fill("Created via E2E Test");

    // Submit
    await page.getByRole("button", { name: "Create Board" }).click(); // Dialog submit button

    // 5. Verify Redirect
    // Should go to /dashboard/boards/[id]
    await page.waitForURL(/\/dashboard\/boards\//);

    // Verify Board Title matches
    // Header should contain board Name
    await expect(page.getByText(boardName)).toBeVisible();
  });
});
