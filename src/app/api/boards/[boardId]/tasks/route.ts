import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
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

    const tasks = await Task.find({ boardId })
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

    // Verify board ownership
    const board = await Board.findOne({
      _id: boardId,
      ownerId: session.user.id,
    }).select("_id properties");

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
