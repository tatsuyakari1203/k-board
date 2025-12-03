import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BoardInvitation } from "@/models/board-member.model";
import BoardMember from "@/models/board-member.model";
import Board from "@/models/board.model";
import { respondInvitationSchema } from "@/lib/validations/board-member";
import { INVITATION_STATUS, type BoardRole } from "@/types/board-member";
import {
  logAudit,
  logActivity,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  ACTIVITY_TYPES,
} from "@/lib/audit";

interface RouteContext {
  params: Promise<{ invitationId: string }>;
}

// POST /api/invitations/[invitationId]/respond - Accept or decline invitation
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = await context.params;
    const body = await request.json();

    const validated = respondInvitationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { action } = validated.data;

    await connectDB();

    const userEmail = session.user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    // Find the invitation
    const invitation = await BoardInvitation.findOne({
      _id: invitationId,
      email: userEmail,
      status: INVITATION_STATUS.PENDING,
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Không tìm thấy lời mời hoặc lời mời đã hết hạn" },
        { status: 404 }
      );
    }

    const boardId = invitation.boardId.toString();
    const board = await Board.findById(boardId).select("name").lean();

    if (action === "accept") {
      // Add user as board member
      await BoardMember.findOneAndUpdate(
        { boardId: invitation.boardId, userId: session.user.id },
        {
          boardId: invitation.boardId,
          userId: session.user.id,
          role: invitation.role as BoardRole,
          addedBy: invitation.invitedBy,
          addedAt: new Date(),
        },
        { upsert: true }
      );

      // Update invitation status
      invitation.status = INVITATION_STATUS.ACCEPTED;
      invitation.acceptedAt = new Date();
      await invitation.save();

      // Log audit
      await logAudit({
        action: AUDIT_ACTIONS.INVITATION_ACCEPTED,
        entityType: AUDIT_ENTITY_TYPES.INVITATION,
        entityId: invitationId,
        entityName: userEmail,
        performedBy: session.user.id,
        details: {
          boardId,
          boardName: board?.name,
          role: invitation.role,
        },
      });

      // Log activity
      await logActivity({
        boardId,
        type: ACTIVITY_TYPES.MEMBER_JOINED,
        userId: session.user.id,
        description: `đã tham gia board với vai trò ${invitation.role}`,
        metadata: {
          memberName: session.user.name,
          memberRole: invitation.role,
        },
      });

      return NextResponse.json({
        message: "Bạn đã tham gia board thành công",
        boardId,
      });
    } else {
      // Decline invitation
      invitation.status = INVITATION_STATUS.DECLINED;
      invitation.declinedAt = new Date();
      await invitation.save();

      // Log audit
      await logAudit({
        action: AUDIT_ACTIONS.INVITATION_DECLINED,
        entityType: AUDIT_ENTITY_TYPES.INVITATION,
        entityId: invitationId,
        entityName: userEmail,
        performedBy: session.user.id,
        details: {
          boardId,
          boardName: board?.name,
        },
      });

      return NextResponse.json({
        message: "Bạn đã từ chối lời mời",
      });
    }
  } catch (error) {
    console.error("POST /api/invitations/[invitationId]/respond error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
