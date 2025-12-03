import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/task.model";
import Board from "@/models/board.model";
import { checkBoardAccess } from "@/lib/board-permissions";
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

    // Check board access
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập board này" },
        { status: 403 }
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
      properties: task.properties || {},
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

    // Check board access - need canEditTasks permission
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess || !access.permissions?.canEditTasks) {
      return NextResponse.json(
        { error: "Bạn không có quyền chỉnh sửa task" },
        { status: 403 }
      );
    }

    // Get existing task to merge properties
    const existingTask = await Task.findOne({ _id: taskId, boardId }).lean();
    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Check edit scope
    if (access.permissions?.editScope === "assigned") {
      const board = await Board.findById(boardId).select("properties").lean();
      const assigneeProp = board?.properties?.find((p: any) => p.type === "people");

      const isCreator = existingTask.createdBy.toString() === session.user.id;
      // Check if assigned (assuming value is array of user IDs)
      const assigneeValue = existingTask.properties?.[assigneeProp?.id];
      const isAssigned = Array.isArray(assigneeValue)
        ? assigneeValue.includes(session.user.id)
        : assigneeValue === session.user.id;

      if (!isCreator && !isAssigned) {
        return NextResponse.json(
          { error: "Bạn chỉ có thể chỉnh sửa task được giao hoặc do bạn tạo" },
          { status: 403 }
        );
      }
    }

    // Prepare update - merge properties if provided
    const updateData = { ...validation.data };
    if (validation.data.properties) {
      updateData.properties = {
        ...(existingTask.properties || {}),
        ...validation.data.properties,
      };
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, boardId },
      { $set: updateData },
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
      properties: task.properties || {},
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

    // Check board access - need canDeleteTasks permission
    const access = await checkBoardAccess(boardId, session.user.id, session.user.role);
    if (!access.hasAccess || !access.permissions?.canDeleteTasks) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa task" },
        { status: 403 }
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
