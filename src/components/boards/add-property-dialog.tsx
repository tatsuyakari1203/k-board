"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Property, PropertyType } from "@/types/board";
import {
  Type,
  Hash,
  Calendar,
  List,
  CheckCircle,
  User,
  DollarSign,
  CheckSquare,
  FileText,
  Plus,
  X,
} from "lucide-react";

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (property: Omit<Property, "id" | "order">) => void;
}

const PROPERTY_TYPES = [
  { value: PropertyType.TEXT, label: "Văn bản", icon: Type },
  { value: PropertyType.NUMBER, label: "Số", icon: Hash },
  { value: PropertyType.DATE, label: "Ngày tháng", icon: Calendar },
  { value: PropertyType.SELECT, label: "Chọn một", icon: List },
  { value: PropertyType.MULTI_SELECT, label: "Chọn nhiều", icon: List },
  { value: PropertyType.STATUS, label: "Trạng thái", icon: CheckCircle },
  { value: PropertyType.PERSON, label: "Người", icon: User },
  { value: PropertyType.CURRENCY, label: "Tiền tệ", icon: DollarSign },
  { value: PropertyType.CHECKBOX, label: "Checkbox", icon: CheckSquare },
  { value: PropertyType.RICH_TEXT, label: "Văn bản dài", icon: FileText },
];

const STATUS_COLORS = [
  { value: "gray", label: "Xám", class: "bg-gray-500" },
  { value: "blue", label: "Xanh dương", class: "bg-blue-500" },
  { value: "green", label: "Xanh lá", class: "bg-green-500" },
  { value: "yellow", label: "Vàng", class: "bg-yellow-500" },
  { value: "orange", label: "Cam", class: "bg-orange-500" },
  { value: "red", label: "Đỏ", class: "bg-red-500" },
  { value: "purple", label: "Tím", class: "bg-purple-500" },
  { value: "pink", label: "Hồng", class: "bg-pink-500" },
];

export function AddPropertyDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddPropertyDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>(PropertyType.TEXT);
  const [options, setOptions] = useState<{ id: string; label: string; color?: string }[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const needsOptions = type === PropertyType.SELECT || type === PropertyType.MULTI_SELECT || type === PropertyType.STATUS;

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    const newOption = {
      id: crypto.randomUUID(),
      label: newOptionLabel.trim(),
      color: type === PropertyType.STATUS ? "gray" : undefined,
    };
    setOptions([...options, newOption]);
    setNewOptionLabel("");
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleUpdateOptionColor = (id: string, color: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, color } : o)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      type,
      options: needsOptions ? options : undefined,
      required: false,
    });

    // Reset form
    setName("");
    setType(PropertyType.TEXT);
    setOptions([]);
    setNewOptionLabel("");
    onOpenChange(false);
  };

  const handleReset = () => {
    setName("");
    setType(PropertyType.TEXT);
    setOptions([]);
    setNewOptionLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) handleReset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm cột mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên cột</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên cột..."
              autoFocus
            />
          </div>

          {/* Property type */}
          <div className="space-y-2">
            <Label>Loại dữ liệu</Label>
            <Select value={type} onValueChange={(v) => setType(v as PropertyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    <div className="flex items-center gap-2">
                      <pt.icon className="h-4 w-4" />
                      <span>{pt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Options for select/status types */}
          {needsOptions && (
            <div className="space-y-2">
              <Label>Tùy chọn</Label>
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    {type === PropertyType.STATUS && (
                      <Select
                        value={option.color || "gray"}
                        onValueChange={(c) => handleUpdateOptionColor(option.id, c)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-3 h-3 rounded-full ${
                                STATUS_COLORS.find((c) => c.value === option.color)?.class || "bg-gray-500"
                              }`}
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_COLORS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${c.class}`} />
                                <span>{c.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      value={option.label}
                      onChange={(e) =>
                        setOptions(
                          options.map((o) =>
                            o.id === option.id ? { ...o, label: e.target.value } : o
                          )
                        )
                      }
                      className="h-8 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRemoveOption(option.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <Input
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Thêm tùy chọn..."
                    className="h-8 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handleAddOption}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Thêm cột
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
