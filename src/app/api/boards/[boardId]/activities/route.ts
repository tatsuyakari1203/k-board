import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Activity from "@/models/activity.model";
import { checkBoardAccess } from "@/lib/board-permissions";

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

// GET /api/boards/[boardId]/activities - Get board activities
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await context.params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const before = url.searchParams.get("before");

    await connectDB();

    // Check board access
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập board này" },
        { status: 403 }
      );
    }

    const activities = await Activity.getBoardActivities(boardId, {
      limit,
      before: before ? new Date(before) : undefined,
    });

    return NextResponse.json({
      activities: activities.map((activity) => {
        const user = activity.userId as unknown as {
          _id: { toString: () => string };
          name: string;
          email: string;
          image?: string;
        };
        const targetUser = activity.targetUserId as unknown as {
          _id: { toString: () => string };
          name: string;
          email: string;
        } | null;

        return {
          _id: activity._id.toString(),
          type: activity.type,
          description: activity.description,
          user: user ? {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          } : null,
          targetUser: targetUser ? {
            _id: targetUser._id.toString(),
            name: targetUser.name,
          } : null,
          taskId: activity.taskId?.toString(),
          metadata: activity.metadata,
          createdAt: activity.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/boards/[boardId]/activities error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
