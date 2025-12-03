import mongoose, { Schema, Document, Model } from "mongoose";

// ============================================
// AUDIT LOG TYPES
// ============================================

export const AUDIT_ACTIONS = {
  // User management
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_APPROVED: "user.approved",
  USER_REJECTED: "user.rejected",
  USER_ACTIVATED: "user.activated",
  USER_DEACTIVATED: "user.deactivated",
  USER_ROLE_CHANGED: "user.role_changed",

  // System settings
  SETTINGS_UPDATED: "settings.updated",

  // Board management
  BOARD_CREATED: "board.created",
  BOARD_UPDATED: "board.updated",
  BOARD_DELETED: "board.deleted",
  BOARD_VISIBILITY_CHANGED: "board.visibility_changed",

  // Board members
  MEMBER_ADDED: "member.added",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  OWNERSHIP_TRANSFERRED: "ownership.transferred",

  // Invitations
  INVITATION_SENT: "invitation.sent",
  INVITATION_ACCEPTED: "invitation.accepted",
  INVITATION_DECLINED: "invitation.declined",
  INVITATION_CANCELLED: "invitation.cancelled",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ENTITY_TYPES = {
  USER: "user",
  BOARD: "board",
  MEMBER: "member",
  INVITATION: "invitation",
  SETTINGS: "settings",
  TASK: "task",
} as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];

// ============================================
// INTERFACES
// ============================================

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: mongoose.Types.ObjectId;
  entityName?: string; // Human readable name (e.g., user name, board name)
  performedBy: mongoose.Types.ObjectId;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>; // Additional context
  previousValue?: Record<string, unknown>; // For update operations
  newValue?: Record<string, unknown>; // For update operations
  createdAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_ACTIONS),
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_ENTITY_TYPES),
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    previousValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
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

// For listing logs by date
AuditLogSchema.index({ performedAt: -1 });

// For filtering by action type and entity
AuditLogSchema.index({ action: 1, entityType: 1, performedAt: -1 });

// For filtering by user
AuditLogSchema.index({ performedBy: 1, performedAt: -1 });

// For filtering by entity
AuditLogSchema.index({ entityType: 1, entityId: 1, performedAt: -1 });

// TTL index to auto-delete old logs after 1 year (optional)
// AuditLogSchema.index({ performedAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// ============================================
// STATIC METHODS
// ============================================

interface IAuditLogModel extends Model<IAuditLog> {
  log(data: {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string | mongoose.Types.ObjectId;
    entityName?: string;
    performedBy: string | mongoose.Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
  }): Promise<IAuditLog>;
}

AuditLogSchema.statics.log = async function (data) {
  return this.create({
    ...data,
    entityId: new mongoose.Types.ObjectId(data.entityId.toString()),
    performedBy: new mongoose.Types.ObjectId(data.performedBy.toString()),
    performedAt: new Date(),
  });
};

// ============================================
// EXPORT
// ============================================

const AuditLog: IAuditLogModel =
  (mongoose.models.AuditLog as IAuditLogModel) ||
  mongoose.model<IAuditLog, IAuditLogModel>("AuditLog", AuditLogSchema);

export default AuditLog;
