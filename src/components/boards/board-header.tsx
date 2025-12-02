"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Table2, Kanban } from "lucide-react";
import { type View, ViewType } from "@/types/board";

interface BoardHeaderProps {
  board: {
    _id: string;
    name: string;
    icon?: string;
    description?: string;
  };
  activeView?: View;
  views: View[];
  onViewChange: (viewId: string) => void;
  onUpdateBoard: (updates: { name?: string; icon?: string; description?: string }) => void;
}

export function BoardHeader({
  board,
  activeView,
  views,
  onViewChange,
  onUpdateBoard,
}: BoardHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(board.name);
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
    <header className="flex-shrink-0 border-b bg-background">
      {/* Top bar */}
      <div className="flex items-center h-11 px-3 gap-2 text-sm">
        <Link
          href="/dashboard/boards"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Boards</span>
        </Link>
      </div>

      {/* Title */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{board.icon || "📋"}</span>
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="text-2xl font-semibold bg-transparent border-none outline-none focus:ring-0 w-full"
              placeholder="Untitled"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-2xl font-semibold cursor-text hover:bg-accent/50 px-1 -mx-1 rounded transition-colors"
            >
              {board.name}
            </h1>
          )}
        </div>
      </div>

      {/* View tabs - Notion style */}
      <div className="flex items-center gap-1 px-6 border-t">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
              activeView?.id === view.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {view.type === ViewType.TABLE ? (
              <Table2 className="h-4 w-4" />
            ) : (
              <Kanban className="h-4 w-4" />
            )}
            <span>{view.name}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
