import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRole extends Document {
  name: string;
  slug: string; // e.g., "editor", "custom_role_1"
  description?: string;
  boardId?: mongoose.Types.ObjectId; // If null, it's a system role available to all boards
  permissions: string[]; // e.g. ["task.create", "task.edit", "board.manage"]
  isSystem: boolean; // System roles cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    boardId: { type: Schema.Types.ObjectId, ref: "Board" },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Composite unique index: slug must be unique per board (null boardId treats as global)
RoleSchema.index({ boardId: 1, slug: 1 }, { unique: true });

export const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;
