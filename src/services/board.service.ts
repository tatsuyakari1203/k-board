import { v4 as uuidv4 } from "uuid";

import Board from "@/models/board.model";
import BoardMember from "@/models/board-member.model";
import { connectDB } from "@/lib/db";
import { BOARD_ROLES } from "@/types/board-member";
import { USER_ROLES } from "@/types/user";
import {
  DEFAULT_STATUS_OPTIONS,
  ViewType,
  createBoardSchema,
  CreateBoardInput,
  UpdateBoardInput,
} from "@/types/board";

export class BoardService {
  /**
   * Get all boards accessible to a user (owned, member, or visible workspace boards).
   * Also populates role information for each board.
   */
  static async getBoards(userId: string, userRole: string) {
    await connectDB();

    let allBoards;

    // Check if user is admin
    if (userRole === USER_ROLES.ADMIN) {
      // Admin sees ALL boards with OWNER privileges
      const boards = await Board.find({})
        .select("name description icon visibility ownerId createdAt updatedAt")
        .populate("ownerId", "name")
        .lean();

      allBoards = boards.map((b) => ({ ...b, role: BOARD_ROLES.OWNER }));
    } else {
      // Get boards where user is owner
      const ownedBoards = await Board.find({ ownerId: userId })
        .select("name description icon visibility createdAt updatedAt")
        .lean();

      // Get boards where user is a member (but not owner)
      const memberships = await BoardMember.find({
        userId: userId,
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
        ownerId: { $ne: userId },
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

    return allBoards;
  }

  /**
   * Create a new board, optionally from a template
   */
  static async createBoard(
    userId: string,
    data: Partial<CreateBoardInput> & { useTemplate?: string | boolean }
  ) {
    await connectDB();

    const { useTemplate, ...boardData } = data;

    let properties = boardData.properties || [];
    let views = boardData.views || [];

    // Generate default properties if using template
    const templateId =
      typeof useTemplate === "string" ? useTemplate : useTemplate ? "survey" : null;

    if (templateId) {
      const { BOARD_TEMPLATES } = await import("@/lib/templates");
      const template = BOARD_TEMPLATES.find((t) => t.id === templateId) || BOARD_TEMPLATES[0];

      // Map properties
      properties = template.properties.map((prop, index) => ({
        ...prop,
        id: uuidv4(),
        order: index,
        options: prop.options?.map((opt) => ({
          ...opt,
          id: uuidv4(),
        })),
        // Ensure type compatibility
        type: prop.type as import("@/types/board").PropertyType,
        required: prop.required || false,
      }));

      // Map views
      views = template.views.map((view, index) => {
        const viewConfig: Record<string, unknown> = {};

        // Map groupBy
        if (view.config.groupBy) {
          const groupProp = properties.find((p) => p.name === view.config.groupBy);
          if (groupProp) {
            viewConfig.groupBy = groupProp.id;
          }
        }

        // Map visibleProperties
        if (view.config.visibleProperties) {
          viewConfig.visibleProperties = view.config.visibleProperties
            .map((name) => properties.find((p) => p.name === name)?.id)
            .filter((id): id is string => !!id);
        } else {
          // Default to all if not specified
          viewConfig.visibleProperties = properties.map((p) => p.id);
        }

        return {
          id: uuidv4(),
          name: view.name,
          type: view.type as ViewType,
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
          required: false,
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
      ...boardData,
      properties,
      views,
    });

    if (!validation.success) {
      throw new Error("Invalid_Data:" + JSON.stringify(validation.error.flatten()));
    }

    const board = await Board.create({
      ...validation.data,
      ownerId: userId,
    });

    // Add owner as a board member
    await BoardMember.create({
      boardId: board._id,
      userId: userId,
      role: BOARD_ROLES.OWNER,
      addedBy: userId,
      addedAt: new Date(),
    });

    return board;
  }

  static async getBoardById(boardId: string) {
    await connectDB();
    return Board.findById(boardId).lean();
  }

  static async updateBoard(boardId: string, data: UpdateBoardInput) {
    await connectDB();
    return Board.findByIdAndUpdate(boardId, { $set: data }, { new: true }).lean();
  }

  static async deleteBoard(boardId: string) {
    await connectDB();
    return Board.findByIdAndDelete(boardId);
  }
}
