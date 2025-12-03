import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import TodoPreference from "@/models/todo-preference.model";
import { PropertyType } from "@/types/board";
import { USER_ROLES } from "@/types/user";

// Types for lean documents
interface TaskDoc {
  _id: { toString: () => string };
  boardId: { toString: () => string };
  createdBy: { toString: () => string };
  title?: string;
  properties?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface BoardDoc {
  _id: { toString: () => string };
  name: string;
  ownerId: { toString: () => string };
  properties?: Array<{ type: string; id: string }>;
}

// GET /api/tasks/my-tasks - Get all tasks assigned to current user across all boards
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    })
      .select("boardId role")
      .lean();

    const memberBoardIds = memberShips.map((m) => m.boardId.toString());
    const memberRoles: Record<string, string> = {};
    memberShips.forEach((m) => {
      memberRoles[m.boardId.toString()] = m.role;
    });

    // Also include boards owned by user
    const ownedBoards = await Board.find({
      ownerId: userId,
    })
      .select("_id")
      .lean();

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
        .filter(
          (p: { type: string }) => p.type === PropertyType.PERSON || p.type === PropertyType.USER
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
    let tasks: TaskDoc[] = [];

    // Get all tasks from full access boards
    if (fullAccessBoardIds.length > 0) {
      const fullAccessTasks = (await Task.find({
        boardId: { $in: fullAccessBoardIds },
      }).lean()) as TaskDoc[];
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
        const assignedTasks = (await Task.find({
          boardId: { $in: assignedOnlyBoardIds },
          $or: orConditions,
        }).lean()) as TaskDoc[];
        tasks = [...tasks, ...assignedTasks];
      }
    }

    // Dedupe tasks
    const taskMap = new Map<string, Record<string, unknown>>();
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
    const sortedTasks = Array.from(taskMap.values());
    const customOrder = prefs.customOrder || [];

    if (customOrder.length > 0 && !prefs.sortField) {
      // Sort by custom order
      sortedTasks.sort((a, b) => {
        const aIndex = customOrder.indexOf(a._id as string);
        const bIndex = customOrder.indexOf(b._id as string);
        // Tasks not in customOrder go to the end
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    } else if (prefs.sortField) {
      // Sort by specified field
      sortedTasks.sort((a, b) => {
        let aVal: string | number, bVal: string | number;

        switch (prefs.sortField) {
          case "title":
            aVal = ((a.title as string) || "").toLowerCase();
            bVal = ((b.title as string) || "").toLowerCase();
            break;
          case "createdAt":
            aVal = new Date(a.createdAt as string).getTime();
            bVal = new Date(b.createdAt as string).getTime();
            break;
          case "updatedAt":
            aVal = new Date(a.updatedAt as string).getTime();
            bVal = new Date(b.updatedAt as string).getTime();
            break;
          case "dueDate": {
            // Find date property for each task's board
            const boardA = (boards as BoardDoc[]).find((bd) => bd._id.toString() === a.boardId);
            const boardB = (boards as BoardDoc[]).find((bd) => bd._id.toString() === b.boardId);
            const datePropA = (boardA?.properties || []).find((p) => p.type === PropertyType.DATE);
            const datePropB = (boardB?.properties || []).find((p) => p.type === PropertyType.DATE);
            const propsA = a.properties as Record<string, unknown> | undefined;
            const propsB = b.properties as Record<string, unknown> | undefined;
            aVal = datePropA ? new Date((propsA?.[datePropA.id] as string) || 0).getTime() : 0;
            bVal = datePropB ? new Date((propsB?.[datePropB.id] as string) || 0).getTime() : 0;
            break;
          }
          default:
            aVal = new Date(a.updatedAt as string).getTime();
            bVal = new Date(b.updatedAt as string).getTime();
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return prefs.sortDirection === "asc" ? comparison : -comparison;
      });
    } else {
      // Default: sort by updatedAt desc
      sortedTasks.sort(
        (a, b) =>
          new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime()
      );
    }

    return NextResponse.json({
      tasks: sortedTasks,
      boards: (boards as BoardDoc[]).map((b) => ({
        _id: b._id.toString(),
        name: b.name,
        properties: b.properties,
        isOwner: b.ownerId.toString() === userId,
      })),
      preferences: prefs,
      canShowAllTasks:
        isAdmin ||
        ownedBoardIds.length > 0 ||
        Object.values(memberRoles).some((r) => r === "admin"),
    });
  } catch (error) {
    console.error("GET /api/tasks/my-tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/tasks/my-tasks - Update todo preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = session.user.id;

    await dbConnect();

    const updateData: Record<string, unknown> = {};

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
