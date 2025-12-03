import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { createTaskSchema } from "@/types/board";

interface RouteParams {
  params: Promise<{ boardId: string }>;
}

// GET /api/boards/[boardId]/tasks - List all tasks in a board
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
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập board này" },
        { status: 403 }
      );
    }

    const query: any = { boardId };

    // If viewScope is assigned, filter by assignee or creator
    if (access.permissions?.viewScope === "assigned") {
      // Find the assignee property (type 'people')
      const board = await Board.findById(boardId).select("properties").lean();
      // Find the first property of type 'people'
      // In a real app, we might want to let the user configure which column is the "Assignee" column
      // For now, we assume the first 'people' column is the assignee
      const assigneeProp = board?.properties?.find((p: any) => p.type === "people");

      if (assigneeProp) {
        query.$or = [
          { [`properties.${assigneeProp.id}`]: session.user.id },
          { createdBy: session.user.id }
        ];
      } else {
        // Fallback: only see tasks created by self
        query.createdBy = session.user.id;
      }
    }

    const tasks = await Task.find(query)
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(
      tasks.map((t) => ({
        ...t,
        _id: t._id.toString(),
        boardId: t.boardId.toString(),
        createdBy: t.createdBy.toString(),
        properties: t.properties || {},
      }))
    );
  } catch (error) {
    console.error("GET /api/boards/[boardId]/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/tasks - Create a new task
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
    const body = await request.json();

    await dbConnect();

    // Check board access - need canCreateTasks permission
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess || !access.permissions?.canCreateTasks) {
      return NextResponse.json(
        { error: "Bạn không có quyền tạo task trong board này" },
        { status: 403 }
      );
    }

    // Get board properties
    const board = await Board.findById(boardId).select("properties");

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Get the max order
    const lastTask = await Task.findOne({ boardId })
      .sort({ order: -1 })
      .select("order");

    const order = (lastTask?.order ?? -1) + 1;

    // Initialize properties with default values
    const properties: Record<string, unknown> = body.properties || {};

    // Validate
    const validation = createTaskSchema.safeParse({
      ...body,
      boardId,
      properties,
      order,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const task = await Task.create({
      ...validation.data,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        ...task.toObject(),
        _id: task._id.toString(),
        boardId: task.boardId.toString(),
        createdBy: task.createdBy.toString(),
        properties: task.properties || {},
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/boards/[boardId]/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
