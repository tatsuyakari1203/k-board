import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { updateBoardSchema } from "@/types/board";

interface RouteParams {
  params: Promise<{ boardId: string }>;
}

// GET /api/boards/[boardId] - Get board with tasks
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { boardId } = await params;

    await dbConnect();

    // Check board access
    const access = await checkBoardAccess(boardId, session.user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập board này" },
        { status: 403 }
      );
    }

    const board = await Board.findById(boardId).lean();

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Get tasks
    const tasks = await Task.find({ boardId })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      ...board,
      _id: board._id.toString(),
      tasks: tasks.map((t) => ({
        ...t,
        _id: t._id.toString(),
        boardId: t.boardId.toString(),
        createdBy: t.createdBy.toString(),
        properties: t.properties || {},
      })),
      // Include user's permissions for UI
      userRole: access.role,
      userPermissions: access.permissions,
    });
  } catch (error) {
    console.error("GET /api/boards/[boardId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/boards/[boardId] - Update board
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { boardId } = await params;
    const body = await request.json();

    await dbConnect();

    // Check board access - need canEditBoard permission
    const access = await checkBoardAccess(boardId, session.user.id);
    if (!access.hasAccess || !access.permissions?.canEditBoard) {
      return NextResponse.json(
        { error: "Bạn không có quyền chỉnh sửa board này" },
        { status: 403 }
      );
    }

    const validation = updateBoardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const board = await Board.findByIdAndUpdate(
      boardId,
      { $set: validation.data },
      { new: true }
    ).lean();

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...board,
      _id: board._id.toString(),
    });
  } catch (error) {
    console.error("PATCH /api/boards/[boardId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId] - Delete board and all tasks
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { boardId } = await params;

    await dbConnect();

    // Check board access - need canDeleteBoard permission (owner only)
    const access = await checkBoardAccess(boardId, session.user.id);
    if (!access.hasAccess || !access.permissions?.canDeleteBoard) {
      return NextResponse.json(
        { error: "Chỉ chủ sở hữu mới có thể xóa board" },
        { status: 403 }
      );
    }

    const board = await Board.findByIdAndDelete(boardId);

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Delete all tasks and members in this board
    await Task.deleteMany({ boardId });
    await BoardMember.deleteMany({ boardId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/boards/[boardId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
