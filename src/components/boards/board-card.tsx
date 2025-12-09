"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import {
  MoreHorizontal,
  Trash2,
  FileText,
  Lock,
  Building2,
  Crown,
  Shield,
  Pencil,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BOARD_ROLES, type BoardRole, type BoardVisibility } from "@/types/board-member";

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

interface BoardCardProps {
  board: BoardListItem;
}

const VISIBILITY_ICONS: Record<BoardVisibility, React.ReactNode> = {
  private: <Lock className="h-4 w-4" />,
  workspace: <Building2 className="h-4 w-4" />,
};

const ROLE_ICONS: Record<BoardRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4 text-yellow-500" />,
  admin: <Shield className="h-4 w-4 text-blue-500" />,
  editor: <Pencil className="h-4 w-4 text-green-500" />,
  viewer: <Eye className="h-4 w-4 text-gray-500" />,
  restricted_editor: <Pencil className="h-4 w-4 text-orange-500" />,
  restricted_viewer: <Eye className="h-4 w-4 text-gray-400" />,
};

interface BoardCardProps {
  board: BoardListItem;
}

export function BoardCard({ board }: BoardCardProps) {
  const router = useRouter();
  const t = useTranslations("BoardComponents.card");
  const tRoles = useTranslations("BoardRoles");
  const tVisibility = useTranslations("BoardVisibility");
  const locale = useLocale();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // This effect is not ideal way to handle date-fns locale but works for client comp
  // Better would be a utility hook, but for now we follow pattern in other files or just import both
  // Actually, formatDistanceToNow requires the specific locale object
  // Let's rely on the fact we only have vi and en
  const getDateLocale = () => {
    // This is a simplified approach, ideally we import dynamically or have a map
    // but since we only have 'vi' and 'en' logic in other places:
    return locale === "vi" ? vi : undefined; // undefined defaults to enUS
  };

  const canDelete = board.role === BOARD_ROLES.OWNER;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/boards/${board._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(t("toastDeleteError"));
      }

      toast.success(t("toastDeleted"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toastError"));
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Link
        href={`/dashboard/boards/${board._id}`}
        className="group block p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-3xl flex-shrink-0">{board.icon || "📋"}</span>
            <div className="min-w-0">
              <h3 className="text-lg font-medium truncate group-hover:text-primary transition-colors">
                {board.name}
              </h3>
              {board.description && (
                <p className="text-base text-muted-foreground truncate mt-1">{board.description}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteBoard")}
                </DropdownMenuItem>
              )}
              {!canDelete && (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  {t("noDeletePermission")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-5 mt-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            {board.taskCount} {t("taskCount")}
          </span>
          {board.visibility && (
            <span
              className="flex items-center gap-1.5"
              title={`${tVisibility("title")}: ${tVisibility(board.visibility)}`}
            >
              {VISIBILITY_ICONS[board.visibility]}
            </span>
          )}
          {board.role && (
            <span className="flex items-center gap-1.5" title={tRoles(board.role)}>
              {ROLE_ICONS[board.role]}
              <span className="text-sm">{tRoles(board.role)}</span>
            </span>
          )}
          <span className="ml-auto">
            {formatDistanceToNow(new Date(board.updatedAt), {
              addSuffix: true,
              locale: getDateLocale(),
            })}
          </span>
        </div>
      </Link>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {t("deleteDesc", { name: board.name, count: board.taskCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
