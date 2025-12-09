"use client";

import { useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Trash2, Copy, Calendar, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AttachmentFile } from "../cells/attachment-cell";
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
  const t = useTranslations("BoardDetails.card");
  const locale = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

        {/* Properties Content */}
        <div className="space-y-2 mt-2">
          {properties.map((prop) => {
            const value = task.properties?.[prop.id];

            // Skip empty values
            if (value === null || value === undefined || value === "") return null;
            if (Array.isArray(value) && value.length === 0) return null;

            // Footer types logic (Date, User) - still skipped here
            // Note: We allow ATTACHMENT here now to show inline
            if (
              prop.type === PropertyType.DATE ||
              prop.type === PropertyType.PERSON ||
              prop.type === PropertyType.USER
            ) {
              return null;
            }

            // Body types
            return (
              <div key={prop.id} className="text-xs">
                {/* Status / Select as Badges */}
                {prop.type === PropertyType.STATUS || prop.type === PropertyType.SELECT ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium border border-transparent inline-block truncate max-w-full",
                      getStatusOption(prop.id, value as string)?.color ||
                        "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {getStatusOption(prop.id, value as string)?.label || (value as string)}
                  </span>
                ) : prop.type === PropertyType.ATTACHMENT ? (
                  /* Attachment Gallery */
                  <div className="flex flex-col gap-2 mt-1.5">
                    {(() => {
                      const images = (value as AttachmentFile[]).filter((f) =>
                        f.type?.startsWith("image/")
                      );

                      if (images.length === 0) return null;

                      // Single Image - Full Width
                      if (images.length === 1) {
                        const file = images[0];
                        return (
                          <div
                            key={file.id}
                            className="relative w-full rounded-md overflow-hidden border bg-muted group/image"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(file.url);
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-auto max-h-60 object-cover hover:scale-105 transition-transform cursor-zoom-in"
                            />
                          </div>
                        );
                      }

                      // Multiple Images - Grid
                      return (
                        <div className="grid grid-cols-4 gap-1.5">
                          {images.map((file) => (
                            <div
                              key={file.id}
                              className="relative aspect-square rounded-md overflow-hidden border bg-muted group/image"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(file.url);
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover hover:scale-110 transition-transform cursor-zoom-in"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Text / Number / Other as Label: Value */
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {prop.name}
                    </span>
                    <span className="text-foreground/90 font-medium line-clamp-3 whitespace-pre-wrap word-break-break-word">
                      {value.toString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer Stats Row (Date, User, Attachment) */}
          {properties.some(
            (p) =>
              (
                [
                  PropertyType.DATE,
                  PropertyType.PERSON,
                  PropertyType.USER,
                  PropertyType.ATTACHMENT,
                ] as string[]
              ).includes(p.type) && task.properties?.[p.id]
          ) && (
            <div className="flex flex-wrap items-center gap-3 pt-2 mt-2 border-t border-border/50 text-muted-foreground">
              {properties.map((prop) => {
                const value = task.properties?.[prop.id];
                if (!value) return null;

                if (prop.type === PropertyType.DATE) {
                  return (
                    <div
                      key={prop.id}
                      className="flex items-center gap-1 text-[11px]"
                      title={prop.name}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(value as string)}</span>
                    </div>
                  );
                }

                if (
                  prop.type === PropertyType.ATTACHMENT &&
                  Array.isArray(value) &&
                  value.length > 0
                ) {
                  return (
                    <div
                      key={prop.id}
                      className="flex items-center gap-1 text-[11px]"
                      title={prop.name}
                    >
                      <Paperclip className="h-3 w-3" />
                      <span>{value.length}</span>
                    </div>
                  );
                }

                return null;
              })}

              {/* Users usually go to the right */}
              <div className="flex items-center -space-x-1.5 ml-auto">
                {properties.map((prop) => {
                  const value = task.properties?.[prop.id];
                  if (
                    !value ||
                    (prop.type !== PropertyType.PERSON && prop.type !== PropertyType.USER)
                  )
                    return null;

                  const userIds = Array.isArray(value) ? value : [value];
                  return userIds.map((uid) => {
                    const user = findUser(uid as string);
                    if (!user) return null;
                    return (
                      <div
                        key={`${prop.id}-${uid}`}
                        className="h-4 w-4 rounded-full ring-1 ring-background bg-muted flex items-center justify-center overflow-hidden"
                        title={user.name}
                      >
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
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

      {/* Lightbox Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
            <DialogTitle className="sr-only">Preview Image</DialogTitle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-full max-h-[90vh] object-contain rounded-md"
            />
          </DialogContent>
        </Dialog>
      )}

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
