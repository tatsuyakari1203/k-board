import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import TodoPreference from "@/models/todo-preference.model";
import { PropertyType } from "@/types/board";
import { USER_ROLES } from "@/types/user";

// GET /api/tasks/my-tasks - Get all tasks assigned to current user across all boards
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.id;
    const userRole = session.user.role;
    const isAdmin = userRole === USER_ROLES.ADMIN;

    // Get user's todo preferences
    let preferences = await TodoPreference.findOne({ userId }).lean();
    if (!preferences) {
      // Create default preferences
      const newPref = await TodoPreference.create({ userId });
      preferences = newPref.toObject();
    }

    // Default values for preferences
    const prefs = {
      customOrder: preferences?.customOrder || [],
      viewMode: preferences?.viewMode || "all",
      sortField: preferences?.sortField || null,
      sortDirection: preferences?.sortDirection || "desc",
      filters: preferences?.filters || { boards: [], statuses: [], dueDateFilter: "all" },
      showAllTasks: preferences?.showAllTasks || false,
    };

    // 1. Find all boards the user has access to
    const memberShips = await BoardMember.find({
      userId,
      status: "active",
    }).select("boardId role").lean();

    const memberBoardIds = memberShips.map((m) => m.boardId.toString());
    const memberRoles: Record<string, string> = {};
    memberShips.forEach((m) => {
      memberRoles[m.boardId.toString()] = m.role;
    });

    // Also include boards owned by user
    const ownedBoards = await Board.find({
      ownerId: userId,
    }).select("_id").lean();

    const ownedBoardIds = ownedBoards.map((b) => b._id.toString());

    // Combine and dedupe
    const allBoardIds = [...new Set([...memberBoardIds, ...ownedBoardIds])];

    if (allBoardIds.length === 0) {
      return NextResponse.json({
        tasks: [],
        boards: [],
        preferences: prefs,
        canShowAllTasks: isAdmin,
      });
    }

    // 2. Get all boards with their properties
    const boards = await Board.find({
      _id: { $in: allBoardIds },
    })
      .select("_id name properties ownerId")
      .lean();

    // Build a map of boardId -> assignee property ids
    const boardAssigneeProps: Record<string, string[]> = {};
    boards.forEach((board) => {
      const assigneeProps = (board.properties || [])
        .filter((p: { type: string }) =>
          p.type === PropertyType.PERSON || p.type === PropertyType.USER
        )
        .map((p: { id: string }) => p.id);
      boardAssigneeProps[board._id.toString()] = assigneeProps;
    });

    // 3. Determine which boards user can see all tasks (owner or admin)
    const fullAccessBoardIds: string[] = [];
    const assignedOnlyBoardIds: string[] = [];

    allBoardIds.forEach((boardId) => {
      const isOwner = ownedBoardIds.includes(boardId);
      const isAdminMember = memberRoles[boardId] === "admin";

      // User can see all tasks if: admin role OR board owner OR board admin member
      // AND showAllTasks preference is enabled
      if ((isAdmin || isOwner || isAdminMember) && prefs.showAllTasks) {
        fullAccessBoardIds.push(boardId);
      } else {
        assignedOnlyBoardIds.push(boardId);
      }
    });

    // 4. Build query for tasks
    let tasks: any[] = [];

    // Get all tasks from full access boards
    if (fullAccessBoardIds.length > 0) {
      const fullAccessTasks = await Task.find({
        boardId: { $in: fullAccessBoardIds },
      }).lean();
      tasks = [...tasks, ...fullAccessTasks];
    }

    // Get only assigned tasks from other boards
    if (assignedOnlyBoardIds.length > 0) {
      // Build OR conditions for assigned tasks
      const orConditions: object[] = [];

      assignedOnlyBoardIds.forEach((boardId) => {
        const propIds = boardAssigneeProps[boardId] || [];
        if (propIds.length > 0) {
          propIds.forEach((propId) => {
            // Check if user is in this property (could be string or array)
            orConditions.push({
              boardId,
              [`properties.${propId}`]: userId,
            });
            orConditions.push({
              boardId,
              [`properties.${propId}`]: { $elemMatch: { $eq: userId } },
            });
          });
        }
      });

      if (orConditions.length > 0) {
        const assignedTasks = await Task.find({
          boardId: { $in: assignedOnlyBoardIds },
          $or: orConditions,
        }).lean();
        tasks = [...tasks, ...assignedTasks];
      }
    }

    // Dedupe tasks
    const taskMap = new Map();
    tasks.forEach((t) => {
      const id = t._id.toString();
      if (!taskMap.has(id)) {
        taskMap.set(id, {
          ...t,
          _id: id,
          boardId: t.boardId.toString(),
          createdBy: t.createdBy.toString(),
          properties: t.properties || {},
        });
      }
    });

    // Sort by custom order if available, otherwise by updatedAt
    let sortedTasks = Array.from(taskMap.values());
    const customOrder = prefs.customOrder || [];

    if (customOrder.length > 0 && !prefs.sortField) {
      // Sort by custom order
      sortedTasks.sort((a, b) => {
        const aIndex = customOrder.indexOf(a._id);
        const bIndex = customOrder.indexOf(b._id);
        // Tasks not in customOrder go to the end
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    } else if (prefs.sortField) {
      // Sort by specified field
      sortedTasks.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (prefs.sortField) {
          case "title":
            aVal = a.title?.toLowerCase() || "";
            bVal = b.title?.toLowerCase() || "";
            break;
          case "createdAt":
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case "updatedAt":
            aVal = new Date(a.updatedAt).getTime();
            bVal = new Date(b.updatedAt).getTime();
            break;
          case "dueDate":
            // Find date property for each task's board
            const boardA = boards.find((b: any) => b._id.toString() === a.boardId);
            const boardB = boards.find((b: any) => b._id.toString() === b.boardId);
            const datePropA = (boardA?.properties || []).find((p: any) => p.type === PropertyType.DATE);
            const datePropB = (boardB?.properties || []).find((p: any) => p.type === PropertyType.DATE);
            aVal = datePropA ? new Date(a.properties?.[datePropA.id] || 0).getTime() : 0;
            bVal = datePropB ? new Date(b.properties?.[datePropB.id] || 0).getTime() : 0;
            break;
          default:
            aVal = new Date(a.updatedAt).getTime();
            bVal = new Date(b.updatedAt).getTime();
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return prefs.sortDirection === "asc" ? comparison : -comparison;
      });
    } else {
      // Default: sort by updatedAt desc
      sortedTasks.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return NextResponse.json({
      tasks: sortedTasks,
      boards: boards.map((b: any) => ({
        _id: b._id.toString(),
        name: b.name,
        properties: b.properties,
        isOwner: b.ownerId.toString() === userId,
      })),
      preferences: prefs,
      canShowAllTasks: isAdmin || ownedBoardIds.length > 0 ||
        Object.values(memberRoles).some(r => r === "admin"),
    });
  } catch (error) {
    console.error("GET /api/tasks/my-tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/my-tasks - Update todo preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;

    await dbConnect();

    const updateData: any = {};

    if (body.customOrder !== undefined) {
      updateData.customOrder = body.customOrder;
    }
    if (body.viewMode !== undefined) {
      updateData.viewMode = body.viewMode;
    }
    if (body.sortField !== undefined) {
      updateData.sortField = body.sortField;
    }
    if (body.sortDirection !== undefined) {
      updateData.sortDirection = body.sortDirection;
    }
    if (body.filters !== undefined) {
      updateData.filters = body.filters;
    }
    if (body.showAllTasks !== undefined) {
      updateData.showAllTasks = body.showAllTasks;
    }

    const preferences = await TodoPreference.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("PATCH /api/tasks/my-tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

