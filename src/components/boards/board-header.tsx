"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Table2, Kanban, Users, Settings, Globe, Lock } from "lucide-react";
import { type View, ViewType } from "@/types/board";
import { type BoardRole, type BoardPermissions, BOARD_VISIBILITY_LABELS, type BoardVisibility } from "@/types/board-member";
import { BoardMembersModal } from "@/components/board/BoardMembersModal";

interface BoardHeaderProps {
  board: {
    _id: string;
    name: string;
    icon?: string;
    description?: string;
    visibility?: BoardVisibility;
  };
  activeView?: View;
  views: View[];
  onViewChange: (viewId: string) => void;
  onUpdateBoard: (updates: { name?: string; icon?: string; description?: string; visibility?: BoardVisibility }) => void;
  userRole?: BoardRole;
  userPermissions?: BoardPermissions;
}

export function BoardHeader({
  board,
  activeView,
  views,
  onViewChange,
  onUpdateBoard,
  userRole,
  userPermissions,
}: BoardHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.name);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canEditBoard = userPermissions?.canEditBoard ?? false;
  const canManageMembers = userPermissions?.canManageMembers ?? false;

  // Sync title when board.name changes
  useEffect(() => {
    setTitle(board.name); // eslint-disable-line react-hooks/set-state-in-effect
  }, [board.name]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== board.name) {
      onUpdateBoard({ name: trimmed });
    } else {
      setTitle(board.name);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setTitle(board.name);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="flex-shrink-0 bg-background">
      {/* Top bar */}
      <div className="flex items-center h-10 px-4 gap-2 text-sm border-b border-border/40">
        <Link
          href="/dashboard/boards"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Boards</span>
        </Link>
      </div>

      {/* Title and actions */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{board.icon || "📋"}</span>
            {isEditingTitle && canEditBoard ? (
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                className="text-xl font-medium bg-transparent border-none outline-none focus:ring-0 w-full"
                placeholder="Untitled"
              />
            ) : (
              <h1
                onClick={() => canEditBoard && setIsEditingTitle(true)}
                className={`text-xl font-medium ${canEditBoard ? "cursor-text hover:bg-accent/40" : ""} px-1 -mx-1 rounded transition-colors`}
              >
                {board.name}
              </h1>
            )}
            {/* Visibility badge */}
            {board.visibility && board.visibility !== "private" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                {board.visibility === "public" ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {BOARD_VISIBILITY_LABELS[board.visibility]}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Thành viên</span>
            </button>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-0.5 px-4">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs transition-colors border-b-2 -mb-px ${
              activeView?.id === view.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {view.type === ViewType.TABLE ? (
              <Table2 className="h-3.5 w-3.5" />
            ) : (
              <Kanban className="h-3.5 w-3.5" />
            )}
            <span>{view.name}</span>
          </button>
        ))}
      </div>

      {/* Members Modal */}
      <BoardMembersModal
        boardId={board._id}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        canManageMembers={canManageMembers}
        canEditBoard={canEditBoard}
        currentVisibility={board.visibility}
        onVisibilityChange={(visibility) => onUpdateBoard({ visibility })}
      />
    </header>
  );
}
