import { connectDB } from "@/lib/db";
import SystemSettingsModel from "@/models/system-settings.model";
import { REGISTRATION_MODE, SETTING_KEYS, type RegistrationMode } from "@/types/system-settings";
import mongoose from "mongoose";

export class SettingsService {
  static async getSetting<T = unknown>(key: string): Promise<T | null> {
    await connectDB();
    const setting = await SystemSettingsModel.findOne({ key });
    return setting ? (setting.value as T) : null;
  }

  static async setSetting<T = unknown>(key: string, value: T, updatedBy?: string) {
    await connectDB();
    const setting = await SystemSettingsModel.findOneAndUpdate(
      { key },
      {
        value,
        ...(updatedBy && { updatedBy: new mongoose.Types.ObjectId(updatedBy) }),
      },
      { upsert: true, new: true }
    );
    return setting!;
  }

  static async getRegistrationMode(): Promise<RegistrationMode> {
    const mode = await SettingsService.getSetting<RegistrationMode>(
      SETTING_KEYS.USER_REGISTRATION_MODE
    );
    return mode || REGISTRATION_MODE.MANUAL_APPROVE;
  }
}
