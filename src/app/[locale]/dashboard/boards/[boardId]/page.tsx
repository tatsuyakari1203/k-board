import { notFound } from "next/navigation";
import { redirect } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import { checkBoardAccess } from "@/lib/board-permissions";
import { BoardDetailWrapper } from "./wrapper";
import { getLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

async function getBoard(boardId: string, userId: string, userRole: string) {
  await dbConnect();

  // Check access
  const access = await checkBoardAccess(boardId, userId, userRole);

  if (!access.hasAccess) {
    return null;
  }

  const board = await Board.findById(boardId).lean();

  if (!board) return null;

  const tasks = await Task.find({ boardId }).sort({ order: 1 }).lean();

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
    userRole: access.role || undefined,
    userPermissions: access.permissions || undefined,
  };
}

export default async function BoardDetailPage({ params }: PageProps) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
    return null;
  }

  const { boardId } = await params;
  const board = await getBoard(boardId, session.user.id, session.user.role);

  if (!board) {
    notFound();
  }

  return <BoardDetailWrapper initialBoard={board} />;
}
