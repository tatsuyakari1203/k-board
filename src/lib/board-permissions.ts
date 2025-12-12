import { connectDB } from "@/lib/db";
import BoardMember from "@/models/board-member.model";
import Board from "@/models/board.model";
import User from "@/models/user.model";
import { USER_ROLES } from "@/types/user";
import {
  BOARD_ROLES,
  BOARD_ROLE_PERMISSIONS,
  type BoardRole,
  type BoardPermissions,
} from "@/types/board-member";

export interface BoardAccessResult {
  hasAccess: boolean;
  role: BoardRole | null;
  permissions: BoardPermissions | null;
  isOwner: boolean;
}

/**
 * Check if a user has access to a board and return their role/permissions
 */
// Helper to convert DB permission codes to legacy BoardPermissions object
function getBoardPermissionsFromCodes(codes: string[]): BoardPermissions {
  const p = new Set(codes);
  return {
    canView: p.has("board.view"),
    viewScope: p.has("view.scope.assigned") ? "assigned" : "all",
    canCreateTasks: p.has("task.create"),
    canEditTasks: p.has("task.edit"),
    editScope: p.has("edit.scope.assigned") ? "assigned" : "all",
    canDeleteTasks: p.has("task.delete"),
    canEditBoard: p.has("board.edit"),
    canManageMembers: p.has("members.manage"),
    canDeleteBoard: p.has("board.delete"),
  };
}

/**
 * Check if a user has access to a board and return their role/permissions
 */
export async function checkBoardAccess(
  boardId: string,
  userId: string,
  userRole?: string
): Promise<BoardAccessResult> {
  await connectDB();
  const { default: Role } = await import("@/models/role.model"); // Dynamic import to avoid cycles if any

  const noAccess: BoardAccessResult = {
    hasAccess: false,
    role: null,
    permissions: null,
    isOwner: false,
  };

  // Check if user is system admin
  let isAdmin = userRole === USER_ROLES.ADMIN;
  if (!userRole) {
    const user = await User.findById(userId).select("role").lean();
    if (user && user.role === USER_ROLES.ADMIN) {
      isAdmin = true;
    }
  }

  // Helper to fetch permissions for a role slug
  const getPermissionsForSlug = async (slug: string, bid?: string) => {
    // Try to find board-specific role first, then system role
    const query = {
      slug,
      $or: [{ boardId: bid }, { boardId: null, isSystem: true }],
    };
    // Sort by boardId (desc) so board specific comes first if exists
    const roleDoc = await Role.findOne(query).sort({ boardId: -1 }).lean();

    if (roleDoc) {
      return getBoardPermissionsFromCodes(roleDoc.permissions);
    }
    // Fallback to legacy constants if DB role missing (safety net)
    console.warn(`Role ${slug} not found in DB, using legacy constants`);
    return BOARD_ROLE_PERMISSIONS[slug as BoardRole] || null;
  };

  if (isAdmin) {
    const permissions = await getPermissionsForSlug(BOARD_ROLES.OWNER);
    return {
      hasAccess: true,
      role: BOARD_ROLES.OWNER, // Admin has owner privileges
      permissions,
      isOwner: false, // Not the creator, but has full access
    };
  }

  // First check if user is the board owner
  const board = await Board.findById(boardId).select("ownerId visibility").lean();

  if (!board) {
    return noAccess;
  }

  // NOTE: In the original logic, owner gets OWNER role.
  const isOwner = board.ownerId.toString() === userId;

  if (isOwner) {
    const permissions = await getPermissionsForSlug(BOARD_ROLES.OWNER);
    return {
      hasAccess: true,
      role: BOARD_ROLES.OWNER,
      permissions,
      isOwner: true,
    };
  }

  // Check if user is a member
  const member = await BoardMember.findOne({ boardId, userId }).lean();

  if (member) {
    const permissions = await getPermissionsForSlug(member.role, boardId);
    return {
      hasAccess: true,
      role: member.role,
      permissions,
      isOwner: false,
    };
  }

  // Check board visibility for non-members
  if (board.visibility === "workspace") {
    // All authenticated users can view workspace boards
    const permissions = await getPermissionsForSlug(BOARD_ROLES.VIEWER);
    return {
      hasAccess: true,
      role: BOARD_ROLES.VIEWER,
      permissions,
      isOwner: false,
    };
  }

  return noAccess;
}

/**
 * Check if user has a specific permission on a board
 */
export async function checkBoardPermission(
  boardId: string,
  userId: string,
  permission: keyof BoardPermissions,
  userRole?: string
): Promise<boolean> {
  const access = await checkBoardAccess(boardId, userId, userRole);
  return access.hasAccess && access.permissions?.[permission] === true;
}

/**
 * Require a specific permission, throw error if not allowed
 */
export async function requireBoardPermission(
  boardId: string,
  userId: string,
  permission: keyof BoardPermissions,
  userRole?: string
): Promise<BoardAccessResult> {
  const access = await checkBoardAccess(boardId, userId, userRole);

  if (!access.hasAccess) {
    throw new Error("Bạn không có quyền truy cập board này");
  }

  if (!access.permissions?.[permission]) {
    throw new Error(`Bạn không có quyền thực hiện thao tác này`);
  }

  return access;
}

/**
 * Get all board IDs that a user has access to
 */
export async function getUserAccessibleBoardIds(userId: string): Promise<string[]> {
  await connectDB();

  // Check if user is admin
  const user = await User.findById(userId).select("role").lean();
  if (user && user.role === USER_ROLES.ADMIN) {
    // Admin can access all boards
    const allBoards = await Board.find({}).select("_id").lean();
    return allBoards.map((b) => b._id.toString());
  }

  // Get boards owned by user
  const ownedBoards = await Board.find({ ownerId: userId }).select("_id").lean();

  // Get boards user is a member of
  const memberBoards = await BoardMember.find({ userId }).select("boardId").lean();

  // Get workspace boards (visible to all users)
  const workspaceBoards = await Board.find({
    visibility: "workspace",
    ownerId: { $ne: userId },
  })
    .select("_id")
    .lean();

  const boardIds = new Set<string>();

  ownedBoards.forEach((b) => boardIds.add(b._id.toString()));
  memberBoards.forEach((m) => boardIds.add(m.boardId.toString()));
  workspaceBoards.forEach((b) => boardIds.add(b._id.toString()));

  return Array.from(boardIds);
}

/**
 * Add owner as a board member when board is created
 */
export async function addBoardOwnerAsMember(boardId: string, ownerId: string): Promise<void> {
  await connectDB();

  await BoardMember.findOneAndUpdate(
    { boardId, userId: ownerId },
    {
      boardId,
      userId: ownerId,
      role: BOARD_ROLES.OWNER,
      addedBy: ownerId,
      addedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}
