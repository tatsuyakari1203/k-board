"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Building2, Globe } from "lucide-react";
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
import {
  BOARD_VISIBILITY,
  BOARD_VISIBILITY_LABELS,
  type BoardVisibility,
} from "@/types/board-member";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VISIBILITY_OPTIONS = [
  {
    value: BOARD_VISIBILITY.PRIVATE,
    icon: Lock,
    description: "Chỉ thành viên được mời",
  },
  {
    value: BOARD_VISIBILITY.WORKSPACE,
    icon: Building2,
    description: "Mọi người trong hệ thống",
  },
  {
    value: BOARD_VISIBILITY.PUBLIC,
    icon: Globe,
    description: "Bất kỳ ai có link",
  },
] as const;

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [useTemplate, setUseTemplate] = useState(true);
  const [visibility, setVisibility] = useState<BoardVisibility>(BOARD_VISIBILITY.PRIVATE);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên board");
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
        throw new Error(data.error || "Không thể tạo board");
      }

      const board = await res.json();
      toast.success("Tạo board thành công!");
      onOpenChange(false);
      setName("");
      setDescription("");
      setVisibility(BOARD_VISIBILITY.PRIVATE);
      router.push(`/dashboard/boards/${board._id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo Board mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên board *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Hồ sơ đo đạc 2024"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về board này"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useTemplate"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="useTemplate" className="text-sm font-normal cursor-pointer">
              Sử dụng template đo đạc (các cột mặc định cho nghiệp vụ đo đạc)
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Chế độ hiển thị</Label>
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
                  <span className="text-xs font-medium">
                    {BOARD_VISIBILITY_LABELS[option.value]}
                  </span>
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
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
