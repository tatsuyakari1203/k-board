import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BoardInvitation } from "@/models/board-member.model";
import Board from "@/models/board.model";
import User from "@/models/user.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { inviteBoardMemberSchema } from "@/lib/validations/board-member";
import { INVITATION_STATUS } from "@/types/board-member";
import { randomUUID } from "crypto";
import {
  logAudit,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "@/lib/audit";

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

// GET /api/boards/[boardId]/invitations - List pending invitations
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await context.params;
    await connectDB();

    // Check if user can manage members
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess || !access.permissions?.canManageMembers) {
      return NextResponse.json(
        { error: "Bạn không có quyền xem lời mời" },
        { status: 403 }
      );
    }

    const invitations = await BoardInvitation.find({
      boardId,
      status: INVITATION_STATUS.PENDING,
      expiresAt: { $gt: new Date() },
    })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      invitations: invitations.map((inv) => {
        const invitedByUser = inv.invitedBy as unknown as { name: string; email: string };
        return {
          _id: inv._id.toString(),
          email: inv.email,
          role: inv.role,
          invitedBy: {
            name: invitedByUser?.name,
            email: invitedByUser?.email,
          },
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/boards/[boardId]/invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/invitations - Create invitation
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await context.params;
    const body = await request.json();

    const validated = inviteBoardMemberSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = validated.data;

    await connectDB();

    // Check if user can manage members
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess || !access.permissions?.canManageMembers) {
      return NextResponse.json(
        { error: "Bạn không có quyền mời thành viên" },
        { status: 403 }
      );
    }

    // Get board name for audit
    const board = await Board.findById(boardId).select("name ownerId").lean();
    if (!board) {
      return NextResponse.json({ error: "Board không tồn tại" }, { status: 404 });
    }

    // Check if board owner is being invited
    const targetUser = await User.findOne({ email: email.toLowerCase() }).lean();
    if (targetUser && targetUser._id.toString() === board.ownerId.toString()) {
      return NextResponse.json(
        { error: "Không thể mời chủ sở hữu" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await BoardInvitation.findOne({
      boardId,
      email: email.toLowerCase(),
      status: INVITATION_STATUS.PENDING,
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Đã có lời mời đang chờ cho email này" },
        { status: 400 }
      );
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await BoardInvitation.create({
      boardId,
      email: email.toLowerCase(),
      role,
      invitedBy: session.user.id,
      status: INVITATION_STATUS.PENDING,
      token: randomUUID(),
      expiresAt,
    });

    // Log audit
    await logAudit({
      action: AUDIT_ACTIONS.INVITATION_SENT,
      entityType: AUDIT_ENTITY_TYPES.INVITATION,
      entityId: invitation._id.toString(),
      entityName: email,
      performedBy: session.user.id,
      details: {
        boardId,
        boardName: board.name,
        email,
        role,
      },
    });

    return NextResponse.json({
      message: "Đã gửi lời mời thành công",
      invitation: {
        _id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("POST /api/boards/[boardId]/invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
