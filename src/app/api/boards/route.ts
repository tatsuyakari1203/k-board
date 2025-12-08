import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import BoardMember from "@/models/board-member.model";
import { BOARD_ROLES } from "@/types/board-member";
import { USER_ROLES } from "@/types/user";
import { createBoardSchema, ViewType, DEFAULT_STATUS_OPTIONS } from "@/types/board";

// GET /api/boards - List all boards for current user (owned + member of)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let allBoards;

    // Check if user is admin
    if (session.user.role === USER_ROLES.ADMIN) {
      // Admin sees ALL boards with OWNER privileges
      const boards = await Board.find({})
        .select("name description icon visibility ownerId createdAt updatedAt")
        .populate("ownerId", "name")
        .lean();

      allBoards = boards.map((b) => ({ ...b, role: BOARD_ROLES.OWNER }));
    } else {
      // Get boards where user is owner
      const ownedBoards = await Board.find({ ownerId: session.user.id })
        .select("name description icon visibility createdAt updatedAt")
        .lean();

      // Get boards where user is a member (but not owner)
      const memberships = await BoardMember.find({
        userId: session.user.id,
      })
        .select("boardId role")
        .lean();

      const memberBoardIds = memberships
        .map((m) => m.boardId.toString())
        .filter((id) => !ownedBoards.some((b) => b._id.toString() === id));

      const memberBoards = await Board.find({
        _id: { $in: memberBoardIds },
      })
        .select("name description icon visibility ownerId createdAt updatedAt")
        .populate("ownerId", "name")
        .lean();

      // Get workspace boards that user is not a member of
      const workspaceBoards = await Board.find({
        visibility: "workspace",
        ownerId: { $ne: session.user.id },
        _id: { $nin: memberBoardIds },
      })
        .select("name description icon visibility ownerId createdAt updatedAt")
        .populate("ownerId", "name")
        .lean();

      // Combine all boards
      allBoards = [
        ...ownedBoards.map((b) => ({ ...b, role: BOARD_ROLES.OWNER })),
        ...memberBoards.map((b) => {
          const membership = memberships.find((m) => m.boardId.toString() === b._id.toString());
          return { ...b, role: membership?.role || BOARD_ROLES.VIEWER };
        }),
        ...workspaceBoards.map((b) => ({ ...b, role: BOARD_ROLES.VIEWER })),
      ];
    }

    // Get task counts
    const Task = (await import("@/models/task.model")).default;
    const boardIds = allBoards.map((b) => b._id);
    const taskCounts = await Task.aggregate([
      { $match: { boardId: { $in: boardIds } } },
      { $group: { _id: "$boardId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(taskCounts.map((tc) => [tc._id.toString(), tc.count]));

    const boardsWithCounts = allBoards.map((board) => ({
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
    const { useTemplate } = body;

    // Generate default properties if using template
    let properties = body.properties || [];
    let views = body.views || [];

    // Generate default properties if using template
    const templateId =
      typeof useTemplate === "string" ? useTemplate : useTemplate ? "survey" : null;

    if (templateId) {
      const { BOARD_TEMPLATES } = await import("@/lib/templates");
      const template = BOARD_TEMPLATES.find((t) => t.id === templateId) || BOARD_TEMPLATES[0]; // Fallback to survey if not found

      // Map properties
      properties = template.properties.map((prop, index) => ({
        ...prop,
        id: uuidv4(),
        order: index,
        options: prop.options?.map((opt) => ({
          ...opt,
          id: uuidv4(),
        })),
      }));

      // Map views
      views = template.views.map((view, index) => {
        const viewConfig: Record<string, unknown> = {};

        // Map groupBy
        if (view.config.groupBy) {
          const groupProp = properties.find(
            (p: { name: string; id: string }) => p.name === view.config.groupBy
          );
          if (groupProp) {
            viewConfig.groupBy = groupProp.id;
          }
        }

        // Map visibleProperties
        if (view.config.visibleProperties) {
          viewConfig.visibleProperties = view.config.visibleProperties
            .map(
              (name: string) =>
                properties.find((p: { name: string; id: string }) => p.name === name)?.id
            )
            .filter(Boolean);
        } else {
          // Default to all if not specified
          viewConfig.visibleProperties = properties.map((p: { id: string }) => p.id);
        }

        return {
          id: uuidv4(),
          name: view.name,
          type: view.type,
          config: viewConfig,
          isDefault: index === 0,
        };
      });
    } else if (properties.length === 0) {
      // Create minimal default properties for blank board
      const statusId = uuidv4();
      properties = [
        {
          id: statusId,
          name: "Trạng thái",
          type: "status",
          order: 0,
          options: DEFAULT_STATUS_OPTIONS.map((opt) => ({
            ...opt,
            id: uuidv4(),
          })),
        },
      ];

      views = [
        {
          id: uuidv4(),
          name: "Bảng",
          type: ViewType.TABLE,
          config: {
            visibleProperties: [statusId],
          },
          isDefault: true,
        },
      ];
    }

    // Validate
    const validation = createBoardSchema.safeParse({
      ...body,
      properties,
      views,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();

    const board = await Board.create({
      ...validation.data,
      ownerId: session.user.id,
    });

    // Add owner as a board member
    await BoardMember.create({
      boardId: board._id,
      userId: session.user.id,
      role: BOARD_ROLES.OWNER,
      addedBy: session.user.id,
      addedAt: new Date(),
    });

    return NextResponse.json({ ...board.toObject(), _id: board._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/boards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
