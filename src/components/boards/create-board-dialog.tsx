"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Lock, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BOARD_TEMPLATES } from "@/lib/templates";
import { BOARD_VISIBILITY, type BoardVisibility } from "@/types/board-member";
import { useTranslations } from "next-intl";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const router = useRouter();
  const t = useTranslations("BoardComponents.createDialog");
  const tVisibility = useTranslations("BoardVisibility");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [useTemplate, setUseTemplate] = useState<string>("survey"); // Default to survey
  const [visibility, setVisibility] = useState<BoardVisibility>(BOARD_VISIBILITY.PRIVATE);
  const [loading, setLoading] = useState(false);

  // Memoize options to use t()
  const VISIBILITY_OPTIONS = [
    {
      value: BOARD_VISIBILITY.PRIVATE,
      icon: Lock,
      description: t("visibility.privateDesc"),
    },
    {
      value: BOARD_VISIBILITY.WORKSPACE,
      icon: Building2,
      description: t("visibility.workspaceDesc"),
    },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("toastNameRequired"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          visibility,
          useTemplate: useTemplate ? "survey" : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("toastError"));
      }

      const board = await res.json();
      toast.success(t("toastSuccess"));
      onOpenChange(false);
      setName("");
      setDescription("");
      setVisibility(BOARD_VISIBILITY.PRIVATE);
      router.push(`/dashboard/boards/${board._id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toastError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("descLabel")}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descPlaceholder")}
            />
          </div>

          <div className="space-y-3">
            <Label>{t("templateLabel")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUseTemplate("")}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors h-full ${
                  !useTemplate
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <div className="mb-2 w-8 h-8 rounded-full bg-background border flex items-center justify-center text-lg">
                  ⚪
                </div>
                <span className="text-sm font-medium">{t("templates.blank")}</span>
                <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t("templates.blankDesc")}
                </span>
              </button>

              {BOARD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setUseTemplate(template.id)}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors h-full ${
                    useTemplate === template.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-input hover:bg-muted/50"
                  }`}
                >
                  <div className="mb-2 w-8 h-8 rounded-full bg-background border flex items-center justify-center text-lg">
                    {template.icon}
                  </div>
                  <span className="text-sm font-medium">{template.name}</span>
                  <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("visibilityLabel")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-colors ${
                    visibility === option.value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-muted/50"
                  }`}
                >
                  <option.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{tVisibility(option.value)}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
