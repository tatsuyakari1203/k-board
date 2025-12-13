/**
 * @jest-environment node
 */
import { describe, it, expect, vi } from "vitest";
import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/admin/roles/route";
import Role from "@/models/role.model";
import { USER_ROLES } from "@/types/user";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";

describe("/api/admin/roles Integration", () => {
  // Clear DB is handled by setup.ts

  it("should return 401 if unauthenticated", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue(null);

    const { req } = createMocks({
      method: "POST",
      body: {
        name: "Test Role",
        slug: "test_role",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });

  it("should return 403 if authenticated but not ADMIN", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue({
      user: {
        id: "user1",
        email: "user@example.com",
        role: USER_ROLES.USER,
      },
    });

    const { req } = createMocks({
      method: "POST",
      body: {
        name: "Test Role",
        slug: "test_role",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(req as any);
    expect(response.status).toBe(403);
  });

  it("should create role if ADMIN", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue({
      user: {
        id: "admin1",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      },
    });

    const body = {
      name: "Test Role",
      slug: "test_role",
      permissions: ["task.create"],
    };

    const request = new Request("http://localhost/api/admin/roles", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(request as any);
    expect(response.status).toBe(201); // Created

    const roleClient = await response.json();
    expect(roleClient.slug).toBe("test_role");

    // Verify DB
    const roleDb = await Role.findOne({ slug: "test_role" });
    expect(roleDb).toBeDefined();
  });

  it("should return 400 if slug already exists", async () => {
    // 1. Setup Admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue({
      user: {
        id: "admin1",
        role: USER_ROLES.ADMIN,
      },
    });

    // 2. Create initial role
    await Role.create({
      name: "Existing",
      slug: "existing_role",
      isSystem: true,
      boardId: null,
      permissions: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 3. Try to create duplicate
    const request = new Request("http://localhost/api/admin/roles", {
      method: "POST",
      body: JSON.stringify({
        name: "New Role",
        slug: "existing_role", // Duplicate
      }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(request as any);
    expect(response.status).toBe(400); // Bad Request
    const data = await response.json();
    expect(data.error).toBe("Role with this slug already exists");
  });
});
