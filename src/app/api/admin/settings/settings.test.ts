/**
 * @jest-environment node
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { GET, PATCH } from "@/app/api/admin/settings/route";
import { USER_ROLES } from "@/types/user";
import { REGISTRATION_MODE, SETTING_KEYS } from "@/types/system-settings";
import SystemSettingsModel from "@/models/system-settings.model";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";

// Mock audit log to avoid DB errors in tests if not needed
vi.mock("@/lib/audit", () => ({
  logSettingsUpdated: vi.fn(),
}));

vi.setConfig({ testTimeout: 20000 });

import { connectDB } from "@/lib/db";

describe("/api/admin/settings Integration", () => {
  beforeAll(async () => {
    await connectDB();
  });
  describe("GET", () => {
    it("should return 401 if unauthenticated", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("should return 403 if not ADMIN", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        user: { id: "000000000000000000000001", role: USER_ROLES.USER },
      });

      const response = await GET();
      expect(response.status).toBe(403);
    });

    it("should return settings if ADMIN", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        user: { id: "000000000000000000000002", role: USER_ROLES.ADMIN },
      });

      // Pre-seed setting
      await SystemSettingsModel.create({
        key: SETTING_KEYS.USER_REGISTRATION_MODE,
        value: REGISTRATION_MODE.AUTO_APPROVE,
      });

      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.settings.user_registration_mode).toBe(REGISTRATION_MODE.AUTO_APPROVE);
    });
  });

  describe("PATCH", () => {
    it("should update settings if ADMIN", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        user: { id: "000000000000000000000002", role: USER_ROLES.ADMIN },
      });

      const body = {
        user_registration_mode: REGISTRATION_MODE.DISABLED,
      };

      const request = new Request("http://localhost/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PATCH(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.settings.user_registration_mode).toBe(REGISTRATION_MODE.DISABLED);

      // Verify DB
      const inDb = await SystemSettingsModel.findOne({
        key: SETTING_KEYS.USER_REGISTRATION_MODE,
      });
      expect(inDb?.value).toBe(REGISTRATION_MODE.DISABLED);
    });

    it("should return 400 for invalid data", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        user: { id: "000000000000000000000002", role: USER_ROLES.ADMIN },
      });

      const request = new Request("http://localhost/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          user_registration_mode: "INVALID_MODE",
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PATCH(request as any);
      expect(response.status).toBe(400);
    });
  });
});
