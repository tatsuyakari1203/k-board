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

// GET /api/invitations - Get all pending invitations for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get user email from session
    const userEmail = session.user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    const invitations = await BoardInvitation.find({
      email: userEmail,
      status: INVITATION_STATUS.PENDING,
      expiresAt: { $gt: new Date() },
    })
      .populate("boardId", "name icon description")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      invitations: invitations.map((inv) => {
        const board = inv.boardId as unknown as { _id: { toString: () => string }; name: string; icon: string; description?: string };
        const invitedByUser = inv.invitedBy as unknown as { name: string; email: string };

        return {
          _id: inv._id.toString(),
          board: {
            _id: board._id.toString(),
            name: board.name,
            icon: board.icon,
            description: board.description,
          },
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
    console.error("GET /api/invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/invitations/[invitationId]/respond - Accept or decline invitation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get invitationId from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const invitationId = pathParts[pathParts.length - 2]; // /api/invitations/[id]/respond

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
    console.error("POST /api/invitations respond error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
