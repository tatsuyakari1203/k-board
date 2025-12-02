import { Suspense } from "react";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import { BoardsPageClient } from "./client";

async function getBoards(userId: string) {
  await dbConnect();

  const boards = await Board.find({ ownerId: userId })
    .select("name description icon createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  // Get task counts
  const boardIds = boards.map((b) => b._id);
  const taskCounts = await Task.aggregate([
    { $match: { boardId: { $in: boardIds } } },
    { $group: { _id: "$boardId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    taskCounts.map((tc) => [tc._id.toString(), tc.count])
  );

  return boards.map((board) => ({
    _id: board._id.toString(),
    name: board.name,
    description: board.description,
    icon: board.icon,
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

  const boards = await getBoards(session.user.id);

  return (
    <div className="space-y-6">
      <Suspense fallback={<BoardsSkeleton />}>
        <BoardsPageClient initialBoards={boards} />
      </Suspense>
    </div>
  );
}
