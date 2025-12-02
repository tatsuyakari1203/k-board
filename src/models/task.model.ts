import mongoose, { Schema, Document, Model } from "mongoose";

// ============================================
// INTERFACES
// ============================================

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  title: string;
  properties: Record<string, unknown>; // { propertyId: value }
  order: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const TaskSchema = new Schema<ITask>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      maxlength: [500, "Tiêu đề không được quá 500 ký tự"],
      trim: true,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

TaskSchema.index({ boardId: 1, order: 1 });
TaskSchema.index({ boardId: 1, createdAt: -1 });
TaskSchema.index({ title: "text" });

// ============================================
// VIRTUAL
// ============================================

TaskSchema.virtual("board", {
  ref: "Board",
  localField: "boardId",
  foreignField: "_id",
  justOne: true,
});

// ============================================
// EXPORT
// ============================================

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
