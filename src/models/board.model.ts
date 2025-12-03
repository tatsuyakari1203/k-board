import mongoose, { Schema, Document, Model } from "mongoose";
import {
  PropertyType,
  ViewType,
  type Property,
  type View,
  type PropertyOption,
  type ViewConfig,
} from "@/types/board";
import { BOARD_VISIBILITY, type BoardVisibility } from "@/types/board-member";

// ============================================
// INTERFACES
// ============================================

export interface IBoard extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  ownerId: mongoose.Types.ObjectId;
  visibility: BoardVisibility;
  properties: Property[];
  views: View[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SUB-SCHEMAS
// ============================================

const PropertyOptionSchema = new Schema<PropertyOption>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String },
  },
  { _id: false }
);

const PropertySchema = new Schema<Property>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, maxlength: 100 },
    type: {
      type: String,
      enum: Object.values(PropertyType),
      required: true,
    },
    options: [PropertyOptionSchema],
    order: { type: Number, required: true, min: 0 },
    required: { type: Boolean, default: false },
    width: { type: Number, min: 50 },
  },
  { _id: false }
);

const FilterSchema = new Schema(
  {
    propertyId: { type: String, required: true },
    operator: {
      type: String,
      enum: [
        "equals",
        "not_equals",
        "contains",
        "not_contains",
        "is_empty",
        "is_not_empty",
        "greater_than",
        "less_than",
      ],
      required: true,
    },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const SortSchema = new Schema(
  {
    propertyId: { type: String, required: true },
    direction: { type: String, enum: ["asc", "desc"], required: true },
  },
  { _id: false }
);

const ViewConfigSchema = new Schema<ViewConfig>(
  {
    groupBy: { type: String },
    sortBy: [SortSchema],
    filters: [FilterSchema],
    visibleProperties: [{ type: String }],
  },
  { _id: false }
);

const ViewSchema = new Schema<View>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, maxlength: 100 },
    type: {
      type: String,
      enum: Object.values(ViewType),
      required: true,
    },
    config: { type: ViewConfigSchema, default: {} },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMA
// ============================================

const BoardSchema = new Schema<IBoard>(
  {
    name: {
      type: String,
      required: [true, "Tên board là bắt buộc"],
      maxlength: [200, "Tên board không được quá 200 ký tự"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Mô tả không được quá 1000 ký tự"],
      trim: true,
    },
    icon: {
      type: String,
      default: "📋",
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visibility: {
      type: String,
      enum: Object.values(BOARD_VISIBILITY),
      default: BOARD_VISIBILITY.PRIVATE,
    },
    properties: {
      type: [PropertySchema],
      default: [],
    },
    views: {
      type: [ViewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

BoardSchema.index({ ownerId: 1, createdAt: -1 });
BoardSchema.index({ name: "text", description: "text" });

// ============================================
// EXPORT
// ============================================

const Board: Model<IBoard> =
  mongoose.models.Board || mongoose.model<IBoard>("Board", BoardSchema);

export default Board;
