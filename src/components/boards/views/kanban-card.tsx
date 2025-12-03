"use client";

import { useState, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  Calendar,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KanbanCardModal } from "./kanban-card-modal";
import { type Property, PropertyType } from "@/types/board";
import { type TaskData } from "@/hooks/use-board-tasks";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface UserOption {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface KanbanCardProps {
  task: TaskData;
  properties: Property[]; // Properties to show on card preview
  allProperties?: Property[]; // All properties for modal (defaults to properties)
  users?: UserOption[];
  isDragging?: boolean;
  onUpdate: (updates: Partial<TaskData>) => void;
  onDelete: () => void;
  onAddPropertyOption?: (propertyId: string, option: { id: string; label: string; color?: string }) => void;
  onUpdatePropertyOption?: (propertyId: string, option: { id: string; label: string; color?: string }) => void;
}

// ============================================
// COMPONENT
// ============================================

export function KanbanCard({
  task,
  properties,
  allProperties,
  users = [],
  isDragging = false,
  onUpdate,
  onDelete,
  onAddPropertyOption,
  onUpdatePropertyOption,
}: KanbanCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  // Setup sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle title update
  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdate({ title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
  }, [editedTitle, task.title, onUpdate]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTitleBlur();
      }
      if (e.key === "Escape") {
        setEditedTitle(task.title);
        setIsEditingTitle(false);
      }
    },
    [handleTitleBlur, task.title]
  );

  // Handle property update
  const handlePropertyUpdate = useCallback(
    (propertyId: string, value: unknown) => {
      onUpdate({
        properties: {
          [propertyId]: value,
        },
      });
    },
    [onUpdate]
  );

  // Get important properties to display
  const displayInfo = useMemo(() => {
    const allProps = allProperties || properties;
    const info: {
      dates: { prop: Property; value: string }[];
      people: { prop: Property; value: string | string[] }[];
      statuses: { prop: Property; value: string }[];
      numbers: { prop: Property; value: number }[];
      attachments: { prop: Property; value: unknown[] }[];
      others: Property[];
    } = {
      dates: [],
      people: [],
      statuses: [],
      numbers: [],
      attachments: [],
      others: [],
    };

    allProps.forEach((prop) => {
      const value = task.properties?.[prop.id];
      if (value === null || value === undefined || value === "") return;

      switch (prop.type) {
        case PropertyType.DATE:
          info.dates.push({ prop, value: value as string });
          break;
        case PropertyType.PERSON:
        case PropertyType.USER:
          info.people.push({ prop, value: value as string | string[] });
          break;
        case PropertyType.STATUS:
        case PropertyType.SELECT:
          info.statuses.push({ prop, value: value as string });
          break;
        case PropertyType.NUMBER:
        case PropertyType.CURRENCY:
          info.numbers.push({ prop, value: value as number });
          break;
        case PropertyType.ATTACHMENT:
          if (Array.isArray(value) && value.length > 0) {
            info.attachments.push({ prop, value });
          }
          break;
        default:
          info.others.push(prop);
      }
    });

    return info;
  }, [allProperties, properties, task.properties]);

  // Count total filled properties
  const filledPropertiesCount = useMemo(() => {
    const allProps = allProperties || properties;
    return allProps.filter((prop) => {
      const value = task.properties?.[prop.id];
      return value !== null && value !== undefined && value !== "";
    }).length;
  }, [allProperties, properties, task.properties]);

  // Find user by ID
  const findUser = useCallback(
    (userId: string) => users.find((u) => u.id === userId),
    [users]
  );

  // Format date
  const formatDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd/MM", { locale: vi });
    } catch {
      return dateStr;
    }
  }, []);

  // Get status option
  const getStatusOption = useCallback(
    (propId: string, optionId: string) => {
      const allProps = allProperties || properties;
      const prop = allProps.find((p) => p.id === propId);
      return prop?.options?.find((o) => o.id === optionId);
    },
    [allProperties, properties]
  );

  // Dragging placeholder
  if (isDragging || isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-40"
      >
        <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg p-3">
          <p className="text-sm font-medium text-primary">{task.title}</p>
        </div>
      </div>
    );
  }

  // Count info items for footer
  const hasFooterInfo = displayInfo.dates.length > 0 ||
                        displayInfo.attachments.length > 0 ||
                        displayInfo.people.length > 0;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "group cursor-pointer mb-2",
          isSortableDragging && "opacity-40"
        )}
      >
        {/* Notion-style card: subtle shadow, clean white bg */}
        <div
          className={cn(
            "bg-background rounded-lg border border-border/50",
            "shadow-sm hover:shadow-md transition-shadow duration-200",
            "active:shadow-lg active:scale-[1.02] transition-transform"
          )}
          onClick={() => setIsModalOpen(true)}
        >
          <div className="p-3 space-y-2">
            {/* Title row with menu */}
            <div className="flex items-start gap-2">
              {/* Title - editable */}
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/50 rounded"
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm text-foreground leading-snug line-clamp-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                  >
                    {task.title}
                  </p>
                )}
              </div>

              {/* Menu - appears on hover */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 shrink-0 -mt-0.5 -mr-1",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mở chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Nhân bản
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tags/Status - inline pills */}
            {displayInfo.statuses.length > 0 && (
              <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                {displayInfo.statuses.slice(0, 3).map(({ prop, value }) => {
                  const option = getStatusOption(prop.id, value);
                  if (!option) return null;
                  return (
                    <span
                      key={prop.id}
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        option.color || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {option.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Footer: meta info row */}
            {hasFooterInfo && (
              <div className="flex items-center justify-between pt-1">
                {/* Left: dates, attachments */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {displayInfo.dates.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(displayInfo.dates[0].value)}</span>
                    </div>
                  )}
                  {displayInfo.attachments.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>
                        {displayInfo.attachments.reduce((acc, { value }) => acc + value.length, 0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: assignees */}
                {displayInfo.people.length > 0 && (
                  <div className="flex items-center">
                    <div className="flex -space-x-1.5">
                      {displayInfo.people.slice(0, 2).flatMap(({ value }) => {
                        const ids = Array.isArray(value) ? value.slice(0, 2) : [value];
                        return ids.map((userId, idx) => {
                          const user = findUser(userId);
                          if (!user) return null;
                          return (
                            <Avatar
                              key={`${userId}-${idx}`}
                              className="h-5 w-5 border border-background"
                            >
                              <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                              <AvatarFallback className="text-[9px] bg-muted">
                                {(user.name || user.email || "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          );
                        });
                      })}
                    </div>
                    {displayInfo.people.reduce((acc, { value }) => {
                      const count = Array.isArray(value) ? value.length : 1;
                      return acc + count;
                    }, 0) > 2 && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        +{displayInfo.people.reduce((acc, { value }) => {
                          const count = Array.isArray(value) ? value.length : 1;
                          return acc + count;
                        }, 0) - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Modal */}
      <KanbanCardModal
        task={task}
        properties={allProperties || properties}
        users={users}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddPropertyOption={onAddPropertyOption}
        onUpdatePropertyOption={onUpdatePropertyOption}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa công việc</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{task.title}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
