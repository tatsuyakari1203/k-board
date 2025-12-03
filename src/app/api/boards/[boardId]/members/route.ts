import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BoardMember from "@/models/board-member.model";
import Board from "@/models/board.model";
import User from "@/models/user.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { addBoardMemberSchema } from "@/lib/validations/board-member";
import { BOARD_ROLE_LABELS, type BoardRole } from "@/types/board-member";
import { logBoardMemberAdded } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

// GET /api/boards/[boardId]/members - List all members
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await context.params;
    await connectDB();

    // Check if user has access to view board
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Bạn không có quyền truy cập board này" }, { status: 403 });
    }

    // Get all members
    const members = await BoardMember.find({ boardId })
      .populate("userId", "name email")
      .populate("addedBy", "name")
      .sort({ role: 1, addedAt: 1 })
      .lean();

    // Get board owner info
    const board = await Board.findById(boardId).select("ownerId").lean();

    // Check if current user is the owner
    const boardOwnerId =
      board?.ownerId && typeof board.ownerId === "object" && "_id" in board.ownerId
        ? (board.ownerId as { _id: { toString: () => string } })._id
        : board?.ownerId;
    const isOwner = session.user.id === boardOwnerId?.toString();

    return NextResponse.json({
      members: members.map((m) => {
        const user = m.userId as unknown as {
          _id: { toString: () => string };
          name: string;
          email: string;
        };
        const addedByUser = m.addedBy as unknown as {
          _id: { toString: () => string };
          name: string;
        } | null;

        return {
          _id: m._id.toString(),
          userId: user._id.toString(),
          user: {
            name: user.name,
            email: user.email,
          },
          role: m.role,
          addedBy: addedByUser
            ? {
                _id: addedByUser._id.toString(),
                name: addedByUser.name,
              }
            : null,
          addedAt: m.addedAt,
          isOwner: user._id.toString() === boardOwnerId?.toString(),
        };
      }),
      currentUserRole: access.role,
      canManageMembers: access.permissions?.canManageMembers,
      canEditBoard: access.permissions?.canEditBoard,
      isOwner,
    });
  } catch (error) {
    console.error("GET /api/boards/[boardId]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/boards/[boardId]/members - Add a new member
export async function POST(request: NextRequest, context: RouteContext) {
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
      return NextResponse.json({ error: "Bạn không có quyền quản lý thành viên" }, { status: 403 });
    }

    const body = await request.json();
    const validated = addBoardMemberSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = validated.data;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng với email này" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await BoardMember.findOne({
      boardId,
      userId: user._id,
    }).lean();

    if (existingMember) {
      return NextResponse.json({ error: "Người dùng đã là thành viên của board" }, { status: 400 });
    }

    // Check if trying to add board owner (owner is auto-added)
    const board = await Board.findById(boardId).select("ownerId").lean();
    if (board?.ownerId.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: "Không thể thêm chủ sở hữu làm thành viên" },
        { status: 400 }
      );
    }

    // Create member
    const member = await BoardMember.create({
      boardId,
      userId: user._id,
      role: role as BoardRole,
      addedBy: session.user.id,
      addedAt: new Date(),
    });

    // Log activity
    await logBoardMemberAdded(
      boardId,
      session.user.id,
      user._id.toString(),
      user.name,
      BOARD_ROLE_LABELS[role as BoardRole] || role
    );

    return NextResponse.json({
      message: "Đã thêm thành viên thành công",
      member: {
        _id: member._id.toString(),
        userId: user._id.toString(),
        user: {
          name: user.name,
          email: user.email,
        },
        role: member.role,
        addedAt: member.addedAt,
      },
    });
  } catch (error) {
    console.error("POST /api/boards/[boardId]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
