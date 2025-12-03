import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BoardMember from "@/models/board-member.model";
import Board from "@/models/board.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { updateBoardMemberSchema } from "@/lib/validations/board-member";
import { BOARD_ROLES, type BoardRole } from "@/types/board-member";

interface RouteContext {
  params: Promise<{ boardId: string; memberId: string }>;
}

// PATCH /api/boards/[boardId]/members/[memberId] - Update member role
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, memberId } = await context.params;
    await connectDB();

    // Check if user can manage members
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess || !access.permissions?.canManageMembers) {
      return NextResponse.json(
        { error: "Bạn không có quyền quản lý thành viên" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateBoardMemberSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Find the member
    const member = await BoardMember.findOne({
      _id: memberId,
      boardId,
    });

    if (!member) {
      return NextResponse.json(
        { error: "Không tìm thấy thành viên" },
        { status: 404 }
      );
    }

    // Check if trying to modify owner
    const board = await Board.findById(boardId).select("ownerId").lean();
    if (member.userId.toString() === board?.ownerId.toString()) {
      return NextResponse.json(
        { error: "Không thể thay đổi vai trò của chủ sở hữu" },
        { status: 400 }
      );
    }

    // Only owner and admin can change admin roles
    if (
      (member.role === BOARD_ROLES.ADMIN || validated.data.role === "admin") &&
      access.role !== BOARD_ROLES.OWNER &&
      access.role !== BOARD_ROLES.ADMIN
    ) {
      return NextResponse.json(
        { error: "Bạn không có quyền thay đổi vai trò admin" },
        { status: 403 }
      );
    }

    member.role = validated.data.role as BoardRole;
    await member.save();

    return NextResponse.json({
      message: "Đã cập nhật vai trò thành công",
      member: {
        _id: member._id.toString(),
        userId: member.userId.toString(),
        role: member.role,
      },
    });
  } catch (error) {
    console.error("PATCH /api/boards/[boardId]/members/[memberId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/members/[memberId] - Remove member
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, memberId } = await context.params;
    await connectDB();

    // Find the member first to check permissions
    const member = await BoardMember.findOne({
      _id: memberId,
      boardId,
    });

    if (!member) {
      return NextResponse.json(
        { error: "Không tìm thấy thành viên" },
        { status: 404 }
      );
    }

    // Check if trying to remove owner
    const board = await Board.findById(boardId).select("ownerId").lean();
    if (member.userId.toString() === board?.ownerId.toString()) {
      return NextResponse.json(
        { error: "Không thể xóa chủ sở hữu khỏi board" },
        { status: 400 }
      );
    }

    // Check permissions
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);

    // User can remove themselves
    const isSelfRemove = member.userId.toString() === session.user.id;

    // Or user with canManageMembers permission can remove others
    if (!isSelfRemove && (!access.hasAccess || !access.permissions?.canManageMembers)) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa thành viên này" },
        { status: 403 }
      );
    }

    // Only owner and admin can remove admins
    if (
      member.role === BOARD_ROLES.ADMIN &&
      access.role !== BOARD_ROLES.OWNER &&
      access.role !== BOARD_ROLES.ADMIN &&
      !isSelfRemove
    ) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa admin" },
        { status: 403 }
      );
    }

    await BoardMember.deleteOne({ _id: memberId });

    return NextResponse.json({
      message: isSelfRemove ? "Bạn đã rời khỏi board" : "Đã xóa thành viên thành công",
    });
  } catch (error) {
    console.error("DELETE /api/boards/[boardId]/members/[memberId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
