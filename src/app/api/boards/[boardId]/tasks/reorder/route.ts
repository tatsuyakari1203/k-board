import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";

interface RouteParams {
  params: Promise<{ boardId: string }>;
}

// Reorder tasks
interface ReorderBody {
  taskIds: string[]; // Array of task IDs in new order
}

// POST /api/boards/[boardId]/tasks/reorder
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { boardId } = await params;
    const body: ReorderBody = await request.json();

    if (!body.taskIds || !Array.isArray(body.taskIds)) {
      return NextResponse.json(
        { error: "taskIds array is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify board ownership
    const board = await Board.findOne({
      _id: boardId,
      ownerId: session.user.id,
    }).select("_id");

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Update order for each task
    const bulkOps = body.taskIds.map((taskId, index) => ({
      updateOne: {
        filter: { _id: taskId, boardId },
        update: { $set: { order: index } },
      },
    }));

    await Task.bulkWrite(bulkOps);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/boards/[boardId]/tasks/reorder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
