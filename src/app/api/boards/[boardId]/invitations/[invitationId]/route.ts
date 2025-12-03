import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BoardInvitation } from "@/models/board-member.model";
import Board from "@/models/board.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { INVITATION_STATUS } from "@/types/board-member";
import {
  logAudit,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "@/lib/audit";

interface RouteContext {
  params: Promise<{ boardId: string; invitationId: string }>;
}

// DELETE /api/boards/[boardId]/invitations/[invitationId] - Cancel invitation
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, invitationId } = await context.params;
    await connectDB();

    // Check if user can manage members
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess || !access.permissions?.canManageMembers) {
      return NextResponse.json(
        { error: "Bạn không có quyền hủy lời mời" },
        { status: 403 }
      );
    }

    const invitation = await BoardInvitation.findOne({
      _id: invitationId,
      boardId,
      status: INVITATION_STATUS.PENDING,
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Không tìm thấy lời mời" },
        { status: 404 }
      );
    }

    // Get board name for audit
    const board = await Board.findById(boardId).select("name").lean();

    // Delete or update status
    await BoardInvitation.deleteOne({ _id: invitationId });

    // Log audit
    await logAudit({
      action: AUDIT_ACTIONS.INVITATION_CANCELLED,
      entityType: AUDIT_ENTITY_TYPES.INVITATION,
      entityId: invitationId,
      entityName: invitation.email,
      performedBy: session.user.id,
      details: {
        boardId,
        boardName: board?.name,
        email: invitation.email,
      },
    });

    return NextResponse.json({
      message: "Đã hủy lời mời thành công",
    });
  } catch (error) {
    console.error("DELETE /api/boards/[boardId]/invitations/[invitationId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
