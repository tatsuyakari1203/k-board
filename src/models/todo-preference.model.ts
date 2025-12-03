import mongoose, { Schema, Document, Model } from "mongoose";

// ============================================
// INTERFACES
// ============================================

export interface ITodoPreference extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  customOrder: string[]; // Array of task IDs in custom order
  viewMode: "all" | "by-board";
  sortField: string | null; // null means use custom order
  sortDirection: "asc" | "desc";
  filters: {
    boards: string[]; // board IDs to show (empty = all)
    statuses: string[]; // status option IDs to show (empty = all)
    dueDateFilter: "all" | "overdue" | "today" | "week" | "no-date";
  };
  showAllTasks: boolean; // For admin/owner: show all tasks in accessible boards
  createdAt: Date;
  updatedAt: Date;
}

export type ITodoPreferenceDocument = ITodoPreference;

// ============================================
// SCHEMA
// ============================================

const TodoPreferenceSchema = new Schema<ITodoPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    customOrder: {
      type: [String],
      default: [],
    },
    viewMode: {
      type: String,
      enum: ["all", "by-board"],
      default: "all",
    },
    sortField: {
      type: String,
      default: null,
    },
    sortDirection: {
      type: String,
      enum: ["asc", "desc"],
      default: "desc",
    },
    filters: {
      boards: {
        type: [String],
        default: [],
      },
      statuses: {
        type: [String],
        default: [],
      },
      dueDateFilter: {
        type: String,
        enum: ["all", "overdue", "today", "week", "no-date"],
        default: "all",
      },
    },
    showAllTasks: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// EXPORT
// ============================================

if (process.env.NODE_ENV === "development" && mongoose.models.TodoPreference) {
  delete mongoose.models.TodoPreference;
}

const TodoPreference: Model<ITodoPreference> =
  mongoose.models.TodoPreference || mongoose.model<ITodoPreference>("TodoPreference", TodoPreferenceSchema);

export default TodoPreference;
