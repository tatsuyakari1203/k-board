import { describe, it, expect } from "vitest";
import { AuthService } from "./auth.service";
import User from "@/models/user.model";
import SystemSettingsModel from "@/models/system-settings.model";
import { REGISTRATION_MODE, SETTING_KEYS } from "@/types/system-settings";
import { USER_ROLES, USER_STATUS } from "@/types/user";

describe("AuthService", () => {
  // Clear DB before each test is handled by setup.ts

  describe("register", () => {
    it("should register the first user as ADMIN (First Run)", async () => {
      const userData = {
        name: "First User",
        email: "owner@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = await AuthService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.role).toBe(USER_ROLES.ADMIN); // Should be ADMIN
      expect(result.user.status).toBe(USER_STATUS.APPROVED); // Should be APPROVED
      expect(result.user.isActive).toBe(true);

      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.role).toBe(USER_ROLES.ADMIN);
    });

    it("should register subsequent users as USER with PENDING status if mode is MANUAL", async () => {
      // 1. Create an existing admin to bypass first-run
      await User.create({
        name: "Admin",
        email: "existing@example.com",
        password: "hashedpassword",
        role: USER_ROLES.ADMIN,
      });

      // 2. Set registration mode to MANUAL
      await SystemSettingsModel.create({
        key: SETTING_KEYS.USER_REGISTRATION_MODE,
        value: REGISTRATION_MODE.MANUAL_APPROVE,
      });

      const userData = {
        name: "Second User",
        email: "member@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = await AuthService.register(userData);

      expect(result.user.role).toBe(USER_ROLES.USER); // Default role
      expect(result.user.status).toBe(USER_STATUS.PENDING); // Manual approve
    });

    it("should register subsequent users as APPROVED if mode is AUTO", async () => {
      // 1. Create admin
      await User.create({
        name: "Admin",
        email: "existing@example.com",
        password: "hashedpassword",
        role: USER_ROLES.ADMIN,
      });

      // 2. Set mode to AUTO
      await SystemSettingsModel.create({
        key: SETTING_KEYS.USER_REGISTRATION_MODE,
        value: REGISTRATION_MODE.AUTO_APPROVE,
      });

      const result = await AuthService.register({
        name: "Auto User",
        email: "auto@example.com",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.user.status).toBe(USER_STATUS.APPROVED);
    });

    it("should throw error if email already exists", async () => {
      await User.create({
        name: "Existing",
        email: "duplicate@example.com",
        password: "password123",
        role: USER_ROLES.USER,
      });

      await expect(
        AuthService.register({
          name: "New User",
          email: "duplicate@example.com",
          password: "password123",
          confirmPassword: "password123",
        })
      ).rejects.toThrow("Email_Exists");
    });
  });
});
