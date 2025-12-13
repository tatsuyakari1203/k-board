import { describe, it, expect } from "vitest";
import { SettingsService } from "./settings.service";
import SystemSettingsModel from "@/models/system-settings.model";
import { REGISTRATION_MODE, SETTING_KEYS } from "@/types/system-settings";

describe("SettingsService", () => {
  // Clear DB is handled by setup.ts

  describe("getSetting", () => {
    it("should return null if setting does not exist", async () => {
      const result = await SettingsService.getSetting("NON_EXISTENT_KEY");
      expect(result).toBeNull();
    });

    it("should return value if setting exists", async () => {
      await SystemSettingsModel.create({
        key: "TEST_KEY",
        value: "TEST_VALUE",
      });

      const result = await SettingsService.getSetting<string>("TEST_KEY");
      expect(result).toBe("TEST_VALUE");
    });
  });

  describe("setSetting", () => {
    it("should create new setting if not exists", async () => {
      await SettingsService.setSetting("NEW_KEY", "NEW_VALUE");

      const inDb = await SystemSettingsModel.findOne({ key: "NEW_KEY" });
      expect(inDb).toBeDefined();
      expect(inDb?.value).toBe("NEW_VALUE");
    });

    it("should update existing setting", async () => {
      await SystemSettingsModel.create({
        key: "UPDATE_KEY",
        value: "OLD_VALUE",
      });

      await SettingsService.setSetting("UPDATE_KEY", "NEW_VALUE");

      const inDb = await SystemSettingsModel.findOne({ key: "UPDATE_KEY" });
      expect(inDb?.value).toBe("NEW_VALUE");
    });
  });

  describe("getRegistrationMode", () => {
    it("should return default MANUAL_APPROVE if not set", async () => {
      const mode = await SettingsService.getRegistrationMode();
      expect(mode).toBe(REGISTRATION_MODE.MANUAL_APPROVE);
    });

    it("should return configured mode", async () => {
      await SettingsService.setSetting(
        SETTING_KEYS.USER_REGISTRATION_MODE,
        REGISTRATION_MODE.AUTO_APPROVE
      );

      const mode = await SettingsService.getRegistrationMode();
      expect(mode).toBe(REGISTRATION_MODE.AUTO_APPROVE);
    });
  });
});
