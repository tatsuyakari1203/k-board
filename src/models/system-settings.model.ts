import mongoose, { Schema, Model, Document } from "mongoose";
import { REGISTRATION_MODE, type RegistrationMode } from "@/types/system-settings";

// Re-export for convenience
export { REGISTRATION_MODE, SETTING_KEYS } from "@/types/system-settings";
export type { RegistrationMode } from "@/types/system-settings";

export interface ISystemSettingsDocument extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: unknown;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const systemSettingsSchema = new Schema<ISystemSettingsDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// MODEL
// ============================================

const SystemSettingsModel: Model<ISystemSettingsDocument> =
  mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettingsDocument>("SystemSettings", systemSettingsSchema);

// ============================================
// HELPER FUNCTIONS (exported separately)
// ============================================

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const setting = await SystemSettingsModel.findOne({ key });
  return setting ? (setting.value as T) : null;
}

export async function setSetting<T = unknown>(
  key: string,
  value: T,
  updatedBy?: string
): Promise<ISystemSettingsDocument> {
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

export async function getRegistrationMode(): Promise<RegistrationMode> {
  const mode = await getSetting<RegistrationMode>("user_registration_mode");
  return mode || REGISTRATION_MODE.MANUAL_APPROVE;
}

export default SystemSettingsModel;
