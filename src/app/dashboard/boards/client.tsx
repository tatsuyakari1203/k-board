"use client";

import { useState } from "react";
import { Plus, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateBoardDialog, BoardCard } from "@/components/boards";
import { BoardRole, BoardVisibility } from "@/types/board-member";

interface BoardListItem {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  visibility?: BoardVisibility;
  role?: BoardRole;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BoardsPageClientProps {
  initialBoards: BoardListItem[];
}

export function BoardsPageClient({ initialBoards }: BoardsPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-base font-medium">Boards</h1>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo board
        </Button>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Board list */}
        {initialBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-lg font-medium mb-2">Chưa có board nào</h2>
            <p className="text-muted-foreground mb-4">
              Tạo board đầu tiên để bắt đầu quản lý công việc
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo board đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialBoards.map((board) => (
              <BoardCard key={board._id} board={board} />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CreateBoardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
