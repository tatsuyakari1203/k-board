import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import TodoPreference from "@/models/todo-preference.model";
import { PropertyType } from "@/types/board";
import { USER_ROLES } from "@/types/user";

interface BoardDoc {
  _id: { toString: () => string };
  name: string;
  ownerId: { toString: () => string };
  properties?: Array<{ type: string; id: string }>;
}

// GET /api/tasks/my-tasks - Get all tasks assigned to current user across all boards - Optimized with Aggregation
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
      const newPref = await TodoPreference.create({ userId });
      preferences = newPref.toObject();
    }

    const prefs = {
      customOrder: preferences?.customOrder || [],
      viewMode: preferences?.viewMode || "all",
      sortField: preferences?.sortField || null,
      sortDirection: preferences?.sortDirection || "desc",
      filters: preferences?.filters || { boards: [], statuses: [], dueDateFilter: "all" },
      showAllTasks: preferences?.showAllTasks || false,
    };

    // 1. Fetch Board Access Info (Metadata) first - Lightweight
    const memberships = await BoardMember.find({ userId }).select("boardId role").lean();
    const ownedBoardIds = (await Board.find({ ownerId: userId }).select("_id").lean()).map((b) =>
      b._id.toString()
    );

    const memberRoles: Record<string, string> = {};
    const memberBoardIds = memberships.map((m) => {
      memberRoles[m.boardId.toString()] = m.role;
      return m.boardId.toString();
    });

    const allBoardIds = [...new Set([...memberBoardIds, ...ownedBoardIds])];

    if (allBoardIds.length === 0) {
      return NextResponse.json({
        tasks: [],
        boards: [],
        preferences: prefs,
        canShowAllTasks: isAdmin,
      });
    }

    // 2. Determine Access Logic (which boards are full access vs restricted)
    // We still fetch board metadata first to know property definitions for restricted boards
    const boards = await Board.find({ _id: { $in: allBoardIds } })
      .select("_id name properties ownerId")
      .lean();

    const fullAccessIds: string[] = [];
    const restrictedBoards: Array<{ id: string; assigneeProps: string[] }> = [];

    boards.forEach((board) => {
      const bId = board._id.toString();
      const isOwner = ownedBoardIds.includes(bId);
      const isAdminMember = memberRoles[bId] === "admin";

      if ((isAdmin || isOwner || isAdminMember) && prefs.showAllTasks) {
        fullAccessIds.push(bId);
      } else {
        // Find assignee properties
        const assigneeProps = (board.properties || [])
          .filter(
            (p: { type: string }) => p.type === PropertyType.PERSON || p.type === PropertyType.USER
          )
          .map((p: { id: string }) => p.id);
        restrictedBoards.push({ id: bId, assigneeProps });
      }
    });

    // 3. Build Aggregation Match Stage
    const matchConditions: Record<string, unknown>[] = [];

    // Condition A: Full Access Boards
    if (fullAccessIds.length > 0) {
      matchConditions.push({
        boardId: { $in: fullAccessIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
    }

    // Condition B: Restricted Boards (Assigned or Created)
    if (restrictedBoards.length > 0) {
      restrictedBoards.forEach((rb) => {
        const boardConditions: Record<string, unknown>[] = [
          { createdBy: new mongoose.Types.ObjectId(userId) }, // Created by user
        ];

        // Assigned to user
        rb.assigneeProps.forEach((propId) => {
          // Direct value check
          boardConditions.push({
            [`properties.${propId}`]: userId,
          });
          // Array value check (for PropertyType.USER)
          boardConditions.push({
            [`properties.${propId}`]: { $elemMatch: { $eq: userId } },
          });
        });

        matchConditions.push({
          boardId: new mongoose.Types.ObjectId(rb.id),
          $or: boardConditions,
        });
      });
    }

    if (matchConditions.length === 0) {
      return NextResponse.json({
        tasks: [],
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
    }

    // 4. Sorting Logic
    const sortStage: Record<string, unknown> = {};
    const projectStage: Record<string, unknown> = {
      _id: { $toString: "$_id" },
      boardId: { $toString: "$boardId" },
      createdBy: { $toString: "$createdBy" },
      title: 1,
      properties: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    // Calculate sort value field
    const addFieldsStage: Record<string, unknown> = {};

    if (prefs.customOrder && prefs.customOrder.length > 0 && !prefs.sortField) {
      // Sort by Custom Order
      addFieldsStage.sortIndex = {
        $indexOfArray: [prefs.customOrder, { $toString: "$_id" }],
      };
      // Sort: found items (index >= 0) first, then others
      // To achieve this with a single sort, we can map -1 (not found) to a large number
      addFieldsStage.normalizedSortIndex = {
        $cond: {
          if: { $eq: ["$sortIndex", -1] },
          then: 999999,
          else: "$sortIndex",
        },
      };
      sortStage.normalizedSortIndex = 1;
      sortStage.updatedAt = -1; // Secondary sort
    } else if (prefs.sortField) {
      // Dynamic Sort
      switch (prefs.sortField) {
        case "title":
          addFieldsStage.sortTitle = { $toLower: "$title" };
          sortStage.sortTitle = prefs.sortDirection === "asc" ? 1 : -1;
          break;
        case "createdAt":
          sortStage.createdAt = prefs.sortDirection === "asc" ? 1 : -1;
          break;
        case "updatedAt":
          sortStage.updatedAt = prefs.sortDirection === "asc" ? 1 : -1;
          break;
        case "dueDate": {
          // Complex: Pick the correct date property from the board
          const branches = boards
            .map((b) => {
              const dateProp = (b.properties || []).find((p) => p.type === PropertyType.DATE);
              if (dateProp) {
                return {
                  case: { $eq: ["$boardId", new mongoose.Types.ObjectId(b._id.toString())] },
                  then: { $ifNull: [`$properties.${dateProp.id}`, null] },
                };
              }
              return null;
            })
            .filter(Boolean);

          if (branches.length > 0) {
            addFieldsStage.dueDateValue = {
              $switch: {
                branches: branches as { case: unknown; then: unknown }[],
                default: null,
              },
            };
            sortStage.dueDateValue = prefs.sortDirection === "asc" ? 1 : -1;
          } else {
            sortStage.updatedAt = -1;
          }
          break;
        }
        default:
          sortStage.updatedAt = -1;
      }
    } else {
      // Default Sort
      sortStage.updatedAt = -1;
    }

    // 5. Run Aggregation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [{ $match: { $or: matchConditions } }];

    if (Object.keys(addFieldsStage).length > 0) {
      pipeline.push({ $addFields: addFieldsStage });
    }

    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    pipeline.push({ $project: projectStage });

    const tasks = await Task.aggregate(pipeline);

    return NextResponse.json({
      tasks,
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
