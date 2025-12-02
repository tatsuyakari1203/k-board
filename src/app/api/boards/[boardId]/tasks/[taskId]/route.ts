import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import { updateTaskSchema } from "@/types/board";

interface RouteParams {
  params: Promise<{ boardId: string; taskId: string }>;
}

// GET /api/boards/[boardId]/tasks/[taskId] - Get a single task
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { boardId, taskId } = await params;

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

    const task = await Task.findOne({
      _id: taskId,
      boardId,
    }).lean();

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...task,
      _id: task._id.toString(),
      boardId: task.boardId.toString(),
      createdBy: task.createdBy.toString(),
    });
  } catch (error) {
    console.error("GET /api/boards/[boardId]/tasks/[taskId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/boards/[boardId]/tasks/[taskId] - Update a task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { boardId, taskId } = await params;
    const body = await request.json();

    // Validate
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
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

    const task = await Task.findOneAndUpdate(
      { _id: taskId, boardId },
      { $set: validation.data },
      { new: true }
    ).lean();

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...task,
      _id: task._id.toString(),
      boardId: task.boardId.toString(),
      createdBy: task.createdBy.toString(),
    });
  } catch (error) {
    console.error("PATCH /api/boards/[boardId]/tasks/[taskId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/tasks/[taskId] - Delete a task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { boardId, taskId } = await params;

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

    const task = await Task.findOneAndDelete({
      _id: taskId,
      boardId,
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/boards/[boardId]/tasks/[taskId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
