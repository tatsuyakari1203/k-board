import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Board from "@/models/board.model";
import BoardMember from "@/models/board-member.model";
import User from "@/models/user.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { BOARD_ROLES } from "@/types/board-member";
import { z } from "zod";
import {
  logAudit,
  logActivity,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  ACTIVITY_TYPES,
} from "@/lib/audit";

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "ID người dùng mới không được trống"),
});

// POST /api/boards/[boardId]/transfer-ownership
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await context.params;
    const body = await request.json();

    const validated = transferOwnershipSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { newOwnerId } = validated.data;

    await connectDB();

    // Check if current user is the owner
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.isOwner) {
      return NextResponse.json(
        { error: "Chỉ chủ sở hữu mới có thể chuyển quyền sở hữu" },
        { status: 403 }
      );
    }

    // Get the board
    const board = await Board.findById(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board không tồn tại" }, { status: 404 });
    }

    // Check if new owner exists
    const newOwner = await User.findById(newOwnerId).select("name email").lean();
    if (!newOwner) {
      return NextResponse.json(
        { error: "Người dùng mới không tồn tại" },
        { status: 404 }
      );
    }

    // Cannot transfer to self
    if (newOwnerId === session.user.id) {
      return NextResponse.json(
        { error: "Bạn đã là chủ sở hữu" },
        { status: 400 }
      );
    }

    const oldOwnerId = board.ownerId.toString();

    // Update board owner
    board.ownerId = newOwnerId as unknown as typeof board.ownerId;
    await board.save();

    // Update board members:
    // 1. New owner becomes "owner" role
    await BoardMember.findOneAndUpdate(
      { boardId, userId: newOwnerId },
      {
        boardId,
        userId: newOwnerId,
        role: BOARD_ROLES.OWNER,
        addedBy: session.user.id,
        addedAt: new Date(),
      },
      { upsert: true }
    );

    // 2. Old owner becomes "admin" (so they still have access)
    await BoardMember.findOneAndUpdate(
      { boardId, userId: oldOwnerId },
      { role: BOARD_ROLES.ADMIN }
    );

    // Log audit
    await logAudit({
      action: AUDIT_ACTIONS.OWNERSHIP_TRANSFERRED,
      entityType: AUDIT_ENTITY_TYPES.BOARD,
      entityId: boardId,
      entityName: board.name,
      performedBy: session.user.id,
      details: {
        previousOwnerId: oldOwnerId,
        newOwnerId,
        newOwnerName: newOwner.name,
      },
    });

    // Log activity
    await logActivity({
      boardId,
      type: ACTIVITY_TYPES.MEMBER_ROLE_CHANGED,
      userId: session.user.id,
      targetUserId: newOwnerId,
      description: `đã chuyển quyền sở hữu cho ${newOwner.name}`,
      metadata: {
        previousOwnerId: oldOwnerId,
        newOwnerId,
        newOwnerName: newOwner.name,
      },
    });

    return NextResponse.json({
      message: "Đã chuyển quyền sở hữu thành công",
      newOwner: {
        _id: newOwner._id.toString(),
        name: newOwner.name,
        email: newOwner.email,
      },
    });
  } catch (error) {
    console.error("POST /api/boards/[boardId]/transfer-ownership error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
