"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { ChevronLeft, Table2, Kanban, Users, Building2, Plus } from "lucide-react";
import { type View, ViewType } from "@/types/board";
import { type BoardRole, type BoardPermissions, type BoardVisibility } from "@/types/board-member";
import { BoardMembersModal } from "@/components/board/BoardMembersModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ViewOption {
  type: ViewType;
  label: string;
  icon: React.ElementType;
}

const VIEW_OPTIONS: ViewOption[] = [
  { type: ViewType.TABLE, label: "Bảng (Table)", icon: Table2 },
  { type: ViewType.KANBAN, label: "Kanban", icon: Kanban },
];

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
  onCreateView: (name: string, type: ViewType) => Promise<string>;
  onUpdateBoard: (updates: {
    name?: string;
    icon?: string;
    description?: string;
    visibility?: BoardVisibility;
  }) => void | Promise<void>;
  userRole?: BoardRole;
  userPermissions?: BoardPermissions;
}

import { useTranslations } from "next-intl";

export function BoardHeader({
  board,
  activeView,
  views,
  onViewChange,
  onCreateView,
  onUpdateBoard,
  userPermissions,
}: BoardHeaderProps) {
  const t = useTranslations("BoardDetails");
  const tVisibility = useTranslations("BoardVisibility");
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
          <span>{t("header.boardsLink")}</span>
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
                placeholder={t("header.untitled")}
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
            {board.visibility === "workspace" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                <Building2 className="h-3 w-3" />
                {tVisibility(board.visibility)}
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
              <span>{t("header.members")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* View tabs and Add button */}
      <div className="flex items-center gap-0.5 px-4">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border-b-2 -mb-px ${
              activeView?.id === view.id
                ? "border-foreground text-foreground font-medium"
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

        {/* Add View Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center h-7 w-7 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-3" align="start">
            <CreateViewForm
              onSubmit={(name, type) => {
                onCreateView(name, type);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Members Modal */}
      <BoardMembersModal
        boardId={board._id}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        canManageMembers={canManageMembers}
        canEditBoard={canEditBoard}
        currentVisibility={board.visibility}
        onVisibilityChange={async (visibility) => {
          await onUpdateBoard({ visibility });
        }}
      />
    </header>
  );
}

function CreateViewForm({ onSubmit }: { onSubmit: (name: string, type: ViewType) => void }) {
  const t = useTranslations("BoardDetails.views");
  const [name, setName] = useState("");
  const [type, setType] = useState<ViewType>(ViewType.TABLE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), type);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <h4 className="font-medium text-sm">{t("create")}</h4>
        <p className="text-xs text-muted-foreground">{t("createDesc")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="view-name" className="text-xs">
          {t("viewName")}
        </Label>
        <Input
          id="view-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("viewNamePlaceholder")}
          className="h-8 text-xs"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">{t("viewType")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {VIEW_OPTIONS.map((opt) => (
            <div
              key={opt.type}
              onClick={() => setType(opt.type)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded border cursor-pointer transition-all ${
                type === opt.type
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <opt.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">
                {opt.label === "Bảng (Table)" ? t("table") : t("kanban")}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" className="h-7 text-xs w-full" disabled={!name.trim()}>
          {t("submitCreate")}
        </Button>
      </div>
    </form>
  );
}
