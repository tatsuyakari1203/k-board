import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BoardService } from "@/services/board.service";
import { TaskService } from "@/services/task.service";
import { BOARD_ROLES } from "@/types/board-member";

// GET /api/boards - List all boards for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boards = await BoardService.getBoards(session.user.id, session.user.role);

    // Get task counts
    const boardIds = boards.map((b) => b._id.toString());
    const countMap = await TaskService.getTaskCountsByBoardIds(boardIds);

    const boardsWithCounts = boards.map((board) => ({
      ...board,
      _id: board._id.toString(),
      taskCount: countMap.get(board._id.toString()) || 0,
    }));

    // Sort: owned first, then by createdAt desc
    boardsWithCounts.sort((a, b) => {
      if (a.role === BOARD_ROLES.OWNER && b.role !== BOARD_ROLES.OWNER) return -1;
      if (a.role !== BOARD_ROLES.OWNER && b.role === BOARD_ROLES.OWNER) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(boardsWithCounts);
  } catch (error) {
    console.error("GET /api/boards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    try {
      const board = await BoardService.createBoard(session.user.id, body);
      return NextResponse.json({ ...board.toObject(), _id: board._id.toString() }, { status: 201 });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith("Invalid_Data:")) {
        return NextResponse.json(
          { error: "Invalid data", details: JSON.parse(error.message.split("Invalid_Data:")[1]) },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("POST /api/boards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
