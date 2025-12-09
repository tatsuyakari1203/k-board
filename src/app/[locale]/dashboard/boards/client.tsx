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

import { useTranslations } from "next-intl";

export function BoardsPageClient({ initialBoards }: BoardsPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const t = useTranslations("Boards");

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-8">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("title")}</h1>
        </div>
        <Button size="lg" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-5 w-5" />
          {t("createBoard")}
        </Button>
      </header>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Board list */}
        {initialBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-7xl mb-5">📋</div>
            <h2 className="text-xl font-semibold mb-3">{t("noBoards")}</h2>
            <p className="text-base text-muted-foreground mb-6">{t("noBoardsDesc")}</p>
            <Button size="lg" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-5 w-5" />
              {t("createFirstBoard")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {initialBoards.map((board) => (
              <BoardCard key={board._id} board={board} />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CreateBoardDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  );
}
