import { Suspense } from "react";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import { BOARD_ROLES } from "@/types/board-member";
import { USER_ROLES } from "@/types/user";
import { BoardsPageClient } from "./client";

async function getBoards(userId: string, userRole: string) {
  await dbConnect();

  let allBoards = [];

  if (userRole === USER_ROLES.ADMIN) {
    const boards = await Board.find({})
      .select("name description icon visibility ownerId createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    allBoards = boards.map((b) => ({ ...b, role: BOARD_ROLES.OWNER }));
  } else {
    // Get boards where user is owner
    const ownedBoards = await Board.find({ ownerId: userId })
      .select("name description icon visibility createdAt updatedAt")
      .lean();

    // Get boards where user is a member
    const memberships = await BoardMember.find({ userId })
      .select("boardId role")
      .lean();

    const memberBoardIds = memberships
      .map((m) => m.boardId.toString())
      .filter((id) => !ownedBoards.some((b) => b._id.toString() === id));

    const memberBoards = await Board.find({ _id: { $in: memberBoardIds } })
      .select("name description icon visibility ownerId createdAt updatedAt")
      .lean();

    // Get workspace/public boards that user is not a member of
    const publicBoards = await Board.find({
      visibility: { $in: ["workspace", "public"] },
      ownerId: { $ne: userId },
      _id: { $nin: memberBoardIds },
    })
      .select("name description icon visibility ownerId createdAt updatedAt")
      .lean();

    allBoards = [
      ...ownedBoards.map((b) => ({ ...b, role: BOARD_ROLES.OWNER })),
      ...memberBoards.map((b) => {
        const membership = memberships.find(
          (m) => m.boardId.toString() === b._id.toString()
        );
        return { ...b, role: membership?.role || BOARD_ROLES.VIEWER };
      }),
      ...publicBoards.map((b) => ({ ...b, role: BOARD_ROLES.VIEWER })),
    ];

    // Sort
    allBoards.sort((a, b) => {
      if (a.role === BOARD_ROLES.OWNER && b.role !== BOARD_ROLES.OWNER)
        return -1;
      if (a.role !== BOARD_ROLES.OWNER && b.role === BOARD_ROLES.OWNER)
        return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // Get task counts
  const boardIds = allBoards.map((b) => b._id);
  const taskCounts = await Task.aggregate([
    { $match: { boardId: { $in: boardIds } } },
    { $group: { _id: "$boardId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    taskCounts.map((tc) => [tc._id.toString(), tc.count])
  );

  return allBoards.map((board) => ({
    _id: board._id.toString(),
    name: board.name,
    description: board.description,
    icon: board.icon,
    visibility: board.visibility,
    role: board.role,
    taskCount: countMap.get(board._id.toString()) || 0,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  }));
}

function BoardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[120px] rounded-lg border border-border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}

export default async function BoardsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const boards = await getBoards(session.user.id, session.user.role);

  return (
    <div className="space-y-6">
      <Suspense fallback={<BoardsSkeleton />}>
        <BoardsPageClient initialBoards={boards} />
      </Suspense>
    </div>
  );
}
