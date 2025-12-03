import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import { PropertyType } from "@/types/board";
import { USER_ROLES } from "@/types/user";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const userId = session.user.id;
    const isAdmin = session.user.role === USER_ROLES.ADMIN;

    // Get boards user has access to
    const memberShips = await BoardMember.find({
      userId,
      status: "active",
    }).select("boardId").lean();

    const memberBoardIds = memberShips.map((m) => m.boardId.toString());

    const ownedBoards = await Board.find({
      ownerId: userId,
    }).select("_id").lean();

    const ownedBoardIds = ownedBoards.map((b) => b._id.toString());
    const allBoardIds = [...new Set([...memberBoardIds, ...ownedBoardIds])];

    // Count boards
    const totalBoards = allBoardIds.length;

    // Get boards with properties for date calculation
    const boards = await Board.find({
      _id: { $in: allBoardIds },
    }).select("_id name properties ownerId updatedAt icon").lean();

    // Get tasks assigned to user
    const boardAssigneeProps: Record<string, string[]> = {};
    const boardDateProps: Record<string, string> = {};

    boards.forEach((board) => {
      const assigneeProps = (board.properties || [])
        .filter((p: { type: string }) =>
          p.type === PropertyType.PERSON || p.type === PropertyType.USER
        )
        .map((p: { id: string }) => p.id);
      boardAssigneeProps[board._id.toString()] = assigneeProps;

      const dateProp = (board.properties || []).find((p: { type: string }) => p.type === PropertyType.DATE);
      if (dateProp) {
        boardDateProps[board._id.toString()] = (dateProp as { id: string }).id;
      }
    });

    // Build query for assigned tasks
    const orConditions: object[] = [];
    allBoardIds.forEach((boardId) => {
      const propIds = boardAssigneeProps[boardId] || [];
      propIds.forEach((propId) => {
        orConditions.push({
          boardId,
          [`properties.${propId}`]: userId,
        });
        orConditions.push({
          boardId,
          [`properties.${propId}`]: { $elemMatch: { $eq: userId } },
        });
      });
    });

    let myTasks: any[] = [];
    if (orConditions.length > 0) {
      myTasks = await Task.find({
        boardId: { $in: allBoardIds },
        $or: orConditions,
      }).lean();
    }

    // Calculate task stats
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    let overdueTasks = 0;
    let todayTasks = 0;
    let weekTasks = 0;
    const recentTasks: any[] = [];

    myTasks.forEach((task) => {
      const boardId = task.boardId.toString();
      const datePropId = boardDateProps[boardId];
      const board = boards.find((b: any) => b._id.toString() === boardId);

      if (datePropId && task.properties?.[datePropId]) {
        const dueDate = new Date(task.properties[datePropId]);

        if (dueDate < startOfToday) {
          overdueTasks++;
        } else if (dueDate >= startOfToday && dueDate < endOfToday) {
          todayTasks++;
        }

        if (dueDate >= startOfWeek && dueDate < endOfWeek) {
          weekTasks++;
        }
      }

      // Add to recent tasks (latest 5)
      if (recentTasks.length < 5) {
        recentTasks.push({
          _id: task._id.toString(),
          title: task.title || "Untitled",
          boardId: task.boardId.toString(),
          boardName: (board as any)?.name || "Unknown",
          updatedAt: task.updatedAt,
        });
      }
    });

    // Sort recent tasks by updatedAt
    recentTasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Get recent boards (latest 5)
    const recentBoards = boards
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((b: any) => ({
        _id: b._id.toString(),
        name: b.name,
        icon: b.icon,
        isOwner: b.ownerId.toString() === userId,
      }));

    // Count pending invitations
    const pendingInvitations = await BoardMember.countDocuments({
      userId,
      status: "pending",
    });

    return NextResponse.json({
      stats: {
        totalBoards,
        totalTasks: myTasks.length,
        overdueTasks,
        todayTasks,
        weekTasks,
        pendingInvitations,
      },
      recentTasks: recentTasks.slice(0, 5),
      recentBoards,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
