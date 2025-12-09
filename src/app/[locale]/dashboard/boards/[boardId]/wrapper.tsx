"use client";

import dynamic from "next/dynamic";
import type { Board } from "@/types/board";
import type { BoardRole, BoardPermissions } from "@/types/board-member";
import type { TaskData } from "@/hooks/use-board-tasks";

// Dynamic import with ssr: false to prevent hydration mismatch
// Radix UI components generate random IDs that differ between server and client
const BoardDetailClient = dynamic(
  () => import("./client").then((mod) => mod.BoardDetailClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

interface BoardData extends Omit<Board, "createdAt" | "updatedAt"> {
  _id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  tasks: TaskData[];
  userRole?: BoardRole;
  userPermissions?: BoardPermissions;
}

interface BoardDetailWrapperProps {
  initialBoard: BoardData;
}

export function BoardDetailWrapper({ initialBoard }: BoardDetailWrapperProps) {
  return <BoardDetailClient initialBoard={initialBoard} />;
}
