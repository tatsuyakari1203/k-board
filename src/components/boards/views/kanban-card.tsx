"use client";

import { useState, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Trash2, Copy, ExternalLink, Calendar, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

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
  onAddPropertyOption?: (
    propertyId: string,
    option: { id: string; label: string; color?: string }
  ) => void;
  onUpdatePropertyOption?: (
    propertyId: string,
    option: { id: string; label: string; color?: string }
  ) => void;
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
  const locale = useLocale();

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

  // Find user by ID
  const findUser = useCallback((userId: string) => users.find((u) => u.id === userId), [users]);

  // Format date
  const formatDate = useCallback(
    (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return format(date, "dd/MM", { locale: locale === "vi" ? vi : enUS });
      } catch {
        return dateStr;
      }
    },
    [locale]
  );

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
      <div ref={setNodeRef} style={style} className="opacity-40">
        <div className="bg-background rounded-lg border shadow-sm p-3 h-[80px]"></div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsModalOpen(true)}
        className="group relative bg-background hover:bg-muted/30 rounded-lg border shadow-sm p-3 space-y-2.5 transition-all select-none cursor-pointer"
      >
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium w-full"
              autoFocus
            />
          ) : (
            <div className="text-sm font-medium leading-tight text-foreground/90 break-words">
              {task.title}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              // Menu trigger
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded text-muted-foreground"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                  {t("rename")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // duplication logic
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> {t("duplicate")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {t("deleteCard")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </button>
        </div>

        {/* Properties Preview */}
        <div className="space-y-2">
          {/* Statuses and Selects */}
          {displayInfo.statuses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayInfo.statuses.map(({ prop, value }) => {
                const opt = getStatusOption(prop.id, value);
                if (!opt) return null;
                return (
                  <div
                    key={prop.id}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-medium border border-transparent truncate max-w-full",
                      opt.color
                    )}
                  >
                    {opt.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Other metadata row */}
          {(displayInfo.dates.length > 0 ||
            displayInfo.people.length > 0 ||
            displayInfo.attachments.length > 0) && (
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              {/* Dates */}
              {displayInfo.dates.map(({ prop, value }) => (
                <div
                  key={prop.id}
                  className="flex items-center gap-1 text-[11px]"
                  title={prop.name}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(value)}</span>
                </div>
              ))}

              {/* Attachments Count */}
              {displayInfo.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-[11px]" title="Tệp đính kèm">
                  <Paperclip className="h-3 w-3" />
                  <span>
                    {displayInfo.attachments.reduce((acc, curr) => acc + curr.value.length, 0)}
                  </span>
                </div>
              )}

              {/* Members */}
              {displayInfo.people.length > 0 && (
                <div className="flex items-center -space-x-1.5 ml-auto">
                  {displayInfo.people.flatMap(({ prop, value }) => {
                    const userIds = Array.isArray(value) ? value : [value];
                    return userIds.map((uid) => {
                      const user = findUser(uid);
                      if (!user) return null;
                      return (
                        <div
                          key={`${prop.id}-${uid}`}
                          className="h-4 w-4 rounded-full ring-1 ring-background bg-muted flex items-center justify-center overflow-hidden"
                          title={user.name}
                        >
                          {user.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={user.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-medium text-muted-foreground">
                              {user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <KanbanCardModal
        task={task}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        properties={allProperties || properties}
        users={users}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddPropertyOption={onAddPropertyOption}
        onUpdatePropertyOption={onUpdatePropertyOption}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa công việc?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Công việc sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
