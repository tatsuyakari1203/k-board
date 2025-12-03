import mongoose, { Schema, Document, Model } from "mongoose";

// ============================================
// ACTIVITY TYPES
// ============================================

export const ACTIVITY_TYPES = {
  // Board activities
  BOARD_CREATED: "board.created",
  BOARD_UPDATED: "board.updated",
  BOARD_PROPERTY_ADDED: "board.property_added",
  BOARD_PROPERTY_REMOVED: "board.property_removed",
  BOARD_VIEW_ADDED: "board.view_added",
  BOARD_VIEW_REMOVED: "board.view_removed",

  // Task activities
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_DELETED: "task.deleted",
  TASK_MOVED: "task.moved", // Order changed or moved between columns

  // Member activities
  MEMBER_JOINED: "member.joined",
  MEMBER_LEFT: "member.left",
  MEMBER_ADDED: "member.added",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role_changed",

  // Comment activities (future)
  COMMENT_ADDED: "comment.added",
  COMMENT_UPDATED: "comment.updated",
  COMMENT_DELETED: "comment.deleted",
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

// ============================================
// INTERFACES
// ============================================

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId; // If activity is related to a task
  type: ActivityType;
  userId: mongoose.Types.ObjectId; // Who performed the action
  targetUserId?: mongoose.Types.ObjectId; // For member activities
  description: string; // Human readable description
  metadata?: {
    propertyId?: string;
    propertyName?: string;
    oldValue?: unknown;
    newValue?: unknown;
    taskTitle?: string;
    memberName?: string;
    memberRole?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const ActivitySchema = new Schema<IActivity>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ACTIVITY_TYPES),
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

// For listing activities by board
ActivitySchema.index({ boardId: 1, createdAt: -1 });

// For listing activities by task
ActivitySchema.index({ taskId: 1, createdAt: -1 });

// For listing activities by user
ActivitySchema.index({ userId: 1, createdAt: -1 });

// TTL index to auto-delete old activities after 90 days (optional)
// ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ============================================
// STATIC METHODS
// ============================================

interface IActivityModel extends Model<IActivity> {
  logActivity(data: {
    boardId: string | mongoose.Types.ObjectId;
    taskId?: string | mongoose.Types.ObjectId;
    type: ActivityType;
    userId: string | mongoose.Types.ObjectId;
    targetUserId?: string | mongoose.Types.ObjectId;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<IActivity>;

  getBoardActivities(
    boardId: string | mongoose.Types.ObjectId,
    options?: { limit?: number; before?: Date }
  ): Promise<IActivity[]>;

  getTaskActivities(
    taskId: string | mongoose.Types.ObjectId,
    options?: { limit?: number }
  ): Promise<IActivity[]>;
}

ActivitySchema.statics.logActivity = async function (data) {
  return this.create({
    boardId: new mongoose.Types.ObjectId(data.boardId.toString()),
    taskId: data.taskId
      ? new mongoose.Types.ObjectId(data.taskId.toString())
      : undefined,
    type: data.type,
    userId: new mongoose.Types.ObjectId(data.userId.toString()),
    targetUserId: data.targetUserId
      ? new mongoose.Types.ObjectId(data.targetUserId.toString())
      : undefined,
    description: data.description,
    metadata: data.metadata,
  });
};

ActivitySchema.statics.getBoardActivities = async function (boardId, options = {}) {
  const { limit = 50, before } = options;

  const query: Record<string, unknown> = {
    boardId: new mongoose.Types.ObjectId(boardId.toString()),
  };

  if (before) {
    query.createdAt = { $lt: before };
  }

  return this.find(query)
    .populate("userId", "name email image")
    .populate("targetUserId", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

ActivitySchema.statics.getTaskActivities = async function (taskId, options = {}) {
  const { limit = 50 } = options;

  return this.find({
    taskId: new mongoose.Types.ObjectId(taskId.toString()),
  })
    .populate("userId", "name email image")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// ============================================
// EXPORT
// ============================================

const Activity: IActivityModel =
  (mongoose.models.Activity as IActivityModel) ||
  mongoose.model<IActivity, IActivityModel>("Activity", ActivitySchema);

export default Activity;
