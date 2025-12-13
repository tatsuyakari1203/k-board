import mongoose, { Schema, Model, Document } from "mongoose";

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

// ============================================
// MODEL
// ============================================

const SystemSettingsModel: Model<ISystemSettingsDocument> =
  mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettingsDocument>("SystemSettings", systemSettingsSchema);

export default SystemSettingsModel;
