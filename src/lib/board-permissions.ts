import { connectDB } from "@/lib/db";
import BoardMember from "@/models/board-member.model";
import Board from "@/models/board.model";
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
export async function checkBoardAccess(
  boardId: string,
  userId: string
): Promise<BoardAccessResult> {
  await connectDB();

  const noAccess: BoardAccessResult = {
    hasAccess: false,
    role: null,
    permissions: null,
    isOwner: false,
  };

  // First check if user is the board owner
  const board = await Board.findById(boardId).select("ownerId visibility").lean();

  if (!board) {
    return noAccess;
  }

  const isOwner = board.ownerId.toString() === userId;

  if (isOwner) {
    return {
      hasAccess: true,
      role: BOARD_ROLES.OWNER,
      permissions: BOARD_ROLE_PERMISSIONS[BOARD_ROLES.OWNER],
      isOwner: true,
    };
  }

  // Check if user is a member
  const member = await BoardMember.findOne({ boardId, userId }).lean();

  if (member) {
    return {
      hasAccess: true,
      role: member.role,
      permissions: BOARD_ROLE_PERMISSIONS[member.role],
      isOwner: false,
    };
  }

  // Check board visibility for non-members
  if (board.visibility === "workspace") {
    // All authenticated users can view workspace boards
    return {
      hasAccess: true,
      role: BOARD_ROLES.VIEWER,
      permissions: BOARD_ROLE_PERMISSIONS[BOARD_ROLES.VIEWER],
      isOwner: false,
    };
  }

  if (board.visibility === "public") {
    // Anyone can view public boards
    return {
      hasAccess: true,
      role: BOARD_ROLES.VIEWER,
      permissions: BOARD_ROLE_PERMISSIONS[BOARD_ROLES.VIEWER],
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
  permission: keyof BoardPermissions
): Promise<boolean> {
  const access = await checkBoardAccess(boardId, userId);
  return access.hasAccess && access.permissions?.[permission] === true;
}

/**
 * Require a specific permission, throw error if not allowed
 */
export async function requireBoardPermission(
  boardId: string,
  userId: string,
  permission: keyof BoardPermissions
): Promise<BoardAccessResult> {
  const access = await checkBoardAccess(boardId, userId);

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

  // Get boards owned by user
  const ownedBoards = await Board.find({ ownerId: userId })
    .select("_id")
    .lean();

  // Get boards user is a member of
  const memberBoards = await BoardMember.find({ userId })
    .select("boardId")
    .lean();

  // Get workspace/public boards
  const publicBoards = await Board.find({
    visibility: { $in: ["workspace", "public"] },
    ownerId: { $ne: userId },
  })
    .select("_id")
    .lean();

  const boardIds = new Set<string>();

  ownedBoards.forEach((b) => boardIds.add(b._id.toString()));
  memberBoards.forEach((m) => boardIds.add(m.boardId.toString()));
  publicBoards.forEach((b) => boardIds.add(b._id.toString()));

  return Array.from(boardIds);
}

/**
 * Add owner as a board member when board is created
 */
export async function addBoardOwnerAsMember(
  boardId: string,
  ownerId: string
): Promise<void> {
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
