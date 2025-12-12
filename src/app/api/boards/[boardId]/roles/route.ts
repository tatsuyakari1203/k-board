import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Role from "@/models/role.model";
import { checkBoardAccess } from "@/lib/board-permissions";

interface Context {
  params: Promise<{ boardId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;

    // Check access to the board
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // Fetch system roles and board-specific roles using DB
    const roles = await Role.find({
      $or: [{ isSystem: true, boardId: null }, { boardId: boardId }],
    })
      .sort({ isSystem: -1, name: 1 })
      .lean();

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
