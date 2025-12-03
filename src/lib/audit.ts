import { connectDB } from "@/lib/db";
import AuditLog, {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
} from "@/models/audit-log.model";
import Activity, {
  ACTIVITY_TYPES,
  type ActivityType,
} from "@/models/activity.model";

// Re-export types for convenience
export { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, ACTIVITY_TYPES };
export type { AuditAction, AuditEntityType, ActivityType };

// ============================================
// AUDIT LOG HELPER
// ============================================

export interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await connectDB();
    await AuditLog.log(params);
  } catch (error) {
    // Log error but don't throw - audit logging should not break main flow
    console.error("Failed to log audit:", error);
  }
}

// ============================================
// ACTIVITY LOG HELPER
// ============================================

export interface ActivityLogParams {
  boardId: string;
  taskId?: string;
  type: ActivityType;
  userId: string;
  targetUserId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    await connectDB();
    await Activity.logActivity(params);
  } catch (error) {
    // Log error but don't throw - activity logging should not break main flow
    console.error("Failed to log activity:", error);
  }
}

// ============================================
// CONVENIENCE FUNCTIONS FOR COMMON ACTIONS
// ============================================

// User management
export async function logUserCreated(
  performedBy: string,
  userId: string,
  userName: string,
  details?: Record<string, unknown>
) {
  return logAudit({
    action: AUDIT_ACTIONS.USER_CREATED,
    entityType: AUDIT_ENTITY_TYPES.USER,
    entityId: userId,
    entityName: userName,
    performedBy,
    details,
  });
}

export async function logUserUpdated(
  performedBy: string,
  userId: string,
  userName: string,
  previousValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
) {
  return logAudit({
    action: AUDIT_ACTIONS.USER_UPDATED,
    entityType: AUDIT_ENTITY_TYPES.USER,
    entityId: userId,
    entityName: userName,
    performedBy,
    previousValue,
    newValue,
  });
}

export async function logUserApproved(
  performedBy: string,
  userId: string,
  userName: string
) {
  return logAudit({
    action: AUDIT_ACTIONS.USER_APPROVED,
    entityType: AUDIT_ENTITY_TYPES.USER,
    entityId: userId,
    entityName: userName,
    performedBy,
  });
}

export async function logUserRejected(
  performedBy: string,
  userId: string,
  userName: string,
  reason?: string
) {
  return logAudit({
    action: AUDIT_ACTIONS.USER_REJECTED,
    entityType: AUDIT_ENTITY_TYPES.USER,
    entityId: userId,
    entityName: userName,
    performedBy,
    details: { reason },
  });
}

export async function logUserDeleted(
  performedBy: string,
  userId: string,
  userName: string
) {
  return logAudit({
    action: AUDIT_ACTIONS.USER_DELETED,
    entityType: AUDIT_ENTITY_TYPES.USER,
    entityId: userId,
    entityName: userName,
    performedBy,
  });
}

export async function logUserRoleChanged(
  performedBy: string,
  userId: string,
  userName: string,
  oldRole: string,
  newRole: string
) {
  return logAudit({
    action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
    entityType: AUDIT_ENTITY_TYPES.USER,
    entityId: userId,
    entityName: userName,
    performedBy,
    previousValue: { role: oldRole },
    newValue: { role: newRole },
  });
}

export async function logSettingsUpdated(
  performedBy: string,
  previousValue: Record<string, unknown>,
  newValue: Record<string, unknown>
) {
  return logAudit({
    action: AUDIT_ACTIONS.SETTINGS_UPDATED,
    entityType: AUDIT_ENTITY_TYPES.SETTINGS,
    entityId: "system",
    entityName: "System Settings",
    performedBy,
    previousValue,
    newValue,
  });
}

// Board activities
export async function logBoardMemberAdded(
  boardId: string,
  userId: string,
  targetUserId: string,
  memberName: string,
  memberRole: string
) {
  return logActivity({
    boardId,
    type: ACTIVITY_TYPES.MEMBER_ADDED,
    userId,
    targetUserId,
    description: `đã thêm ${memberName} với vai trò ${memberRole}`,
    metadata: { memberName, memberRole },
  });
}

export async function logBoardMemberRemoved(
  boardId: string,
  userId: string,
  targetUserId: string,
  memberName: string
) {
  return logActivity({
    boardId,
    type: ACTIVITY_TYPES.MEMBER_REMOVED,
    userId,
    targetUserId,
    description: `đã xóa ${memberName} khỏi board`,
    metadata: { memberName },
  });
}

export async function logBoardMemberRoleChanged(
  boardId: string,
  userId: string,
  targetUserId: string,
  memberName: string,
  oldRole: string,
  newRole: string
) {
  return logActivity({
    boardId,
    type: ACTIVITY_TYPES.MEMBER_ROLE_CHANGED,
    userId,
    targetUserId,
    description: `đã thay đổi vai trò của ${memberName} từ ${oldRole} thành ${newRole}`,
    metadata: { memberName, oldRole, newRole },
  });
}

export async function logTaskCreated(
  boardId: string,
  taskId: string,
  userId: string,
  taskTitle: string
) {
  return logActivity({
    boardId,
    taskId,
    type: ACTIVITY_TYPES.TASK_CREATED,
    userId,
    description: `đã tạo task "${taskTitle || "Không có tiêu đề"}"`,
    metadata: { taskTitle },
  });
}

export async function logTaskUpdated(
  boardId: string,
  taskId: string,
  userId: string,
  propertyName: string,
  oldValue: unknown,
  newValue: unknown
) {
  return logActivity({
    boardId,
    taskId,
    type: ACTIVITY_TYPES.TASK_UPDATED,
    userId,
    description: `đã cập nhật ${propertyName}`,
    metadata: { propertyName, oldValue, newValue },
  });
}

export async function logTaskDeleted(
  boardId: string,
  taskId: string,
  userId: string,
  taskTitle: string
) {
  return logActivity({
    boardId,
    taskId,
    type: ACTIVITY_TYPES.TASK_DELETED,
    userId,
    description: `đã xóa task "${taskTitle || "Không có tiêu đề"}"`,
    metadata: { taskTitle },
  });
}
