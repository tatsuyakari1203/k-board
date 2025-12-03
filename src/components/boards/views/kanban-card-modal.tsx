"use client";

import { useState, useCallback } from "react";
import { Trash2, X, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyCell } from "./property-cell";
import { type Property } from "@/types/board";
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

interface KanbanCardModalProps {
  task: TaskData;
  properties: Property[];
  users?: UserOption[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<TaskData>) => void;
  onDelete: () => void;
  onAddPropertyOption?: (propertyId: string, option: { id: string; label: string; color?: string }) => void;
  onUpdatePropertyOption?: (propertyId: string, option: { id: string; label: string; color?: string }) => void;
}

// ============================================
// COMPONENT
// ============================================

export function KanbanCardModal({
  task,
  properties,
  users = [],
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddPropertyOption,
  onUpdatePropertyOption,
}: KanbanCardModalProps) {
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle title update
  const handleTitleBlur = useCallback(() => {
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
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        setEditedTitle(task.title);
        (e.target as HTMLInputElement).blur();
      }
    },
    [task.title]
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

  // Handle delete
  const handleDelete = useCallback(() => {
    onDelete();
    setShowDeleteDialog(false);
    onClose();
  }, [onDelete, onClose]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          {/* Header - Notion style: large title, minimal chrome */}
          <div className="px-10 pt-8 pb-4">
            <div className="flex items-start justify-between gap-4">
              {/* Large editable title */}
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled"
                className={cn(
                  "flex-1 text-3xl font-bold bg-transparent border-none outline-none",
                  "placeholder:text-muted-foreground/40",
                  "focus:ring-0"
                )}
              />

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Properties List - Notion style: clean rows */}
          <div className="flex-1 overflow-y-auto px-10 pb-8">
            <div className="space-y-1">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 py-1.5 rounded-md hover:bg-muted/50 -mx-2 px-2 group"
                >
                  {/* Property Label */}
                  <div className="w-32 shrink-0 text-sm text-muted-foreground truncate">
                    {property.name}
                  </div>

                  {/* Property Value */}
                  <div className="flex-1 min-w-0">
                    <PropertyCell
                      property={property}
                      value={task.properties?.[property.id]}
                      users={users}
                      onChange={(newValue) => handlePropertyUpdate(property.id, newValue)}
                      onAddOption={
                        onAddPropertyOption
                          ? (_propId, opt) => onAddPropertyOption(property.id, opt)
                          : undefined
                      }
                      onUpdateOption={
                        onUpdatePropertyOption
                          ? (_propId, opt) => onUpdatePropertyOption(property.id, opt)
                          : undefined
                      }
                    />
                  </div>
                </div>
              ))}

              {properties.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Chưa có thuộc tính nào
                </div>
              )}
            </div>

            {/* Meta info - subtle footer */}
            <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
              Tạo lúc {new Date(task.createdAt).toLocaleDateString("vi-VN")}
              {task.updatedAt !== task.createdAt && (
                <> · Cập nhật {new Date(task.updatedAt).toLocaleDateString("vi-VN")}</>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              onClick={handleDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
