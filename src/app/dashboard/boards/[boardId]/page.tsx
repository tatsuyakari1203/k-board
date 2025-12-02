import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import { BoardDetailClient } from "./client";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

async function getBoard(boardId: string, userId: string) {
  await dbConnect();

  const board = await Board.findOne({
    _id: boardId,
    ownerId: userId,
  }).lean();

  if (!board) return null;

  const tasks = await Task.find({ boardId })
    .sort({ order: 1 })
    .lean();

  return {
    ...board,
    _id: board._id.toString(),
    ownerId: board.ownerId.toString(),
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    tasks: tasks.map((t) => ({
      ...t,
      _id: t._id.toString(),
      boardId: t.boardId.toString(),
      createdBy: t.createdBy.toString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      properties: t.properties || {},
    })),
  };
}

export default async function BoardDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { boardId } = await params;
  const board = await getBoard(boardId, session.user.id);

  if (!board) {
    notFound();
  }

  return <BoardDetailClient initialBoard={board} />;
}
