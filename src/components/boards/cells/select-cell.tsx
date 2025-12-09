"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Color palette for options
type TranslationFunction = (key: string) => string;

interface OptionColor {
  value: string;
  label: string;
  preview: string;
}

const getOptionColors = (t: TranslationFunction): OptionColor[] => [
  { value: "bg-gray-100 text-gray-800", label: t("colors.gray"), preview: "bg-gray-400" },
  { value: "bg-red-100 text-red-800", label: t("colors.red"), preview: "bg-red-400" },
  { value: "bg-orange-100 text-orange-800", label: t("colors.orange"), preview: "bg-orange-400" },
  { value: "bg-yellow-100 text-yellow-800", label: t("colors.yellow"), preview: "bg-yellow-400" },
  { value: "bg-green-100 text-green-800", label: t("colors.green"), preview: "bg-green-400" },
  { value: "bg-teal-100 text-teal-800", label: t("colors.teal"), preview: "bg-teal-400" },
  { value: "bg-blue-100 text-blue-800", label: t("colors.blue"), preview: "bg-blue-400" },
  { value: "bg-indigo-100 text-indigo-800", label: t("colors.indigo"), preview: "bg-indigo-400" },
  { value: "bg-purple-100 text-purple-800", label: t("colors.purple"), preview: "bg-purple-400" },
  { value: "bg-pink-100 text-pink-800", label: t("colors.pink"), preview: "bg-pink-400" },
];

function ColorPicker({
  value,
  onChange,
  className,
  optionColors,
}: {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  optionColors: OptionColor[];
}) {
  const [open, setOpen] = useState(false);
  const currentColor = optionColors.find((c) => c.value === value) || optionColors[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-6 h-6 rounded border border-border flex items-center justify-center hover:border-primary transition-colors",
            className
          )}
          title="Chọn màu"
        >
          <div className={cn("w-4 h-4 rounded-sm", currentColor.preview)} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-5 gap-1.5">
          {optionColors.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                onChange(color.value);
                setOpen(false);
              }}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110",
                color.preview,
                value === color.value && "ring-2 ring-primary ring-offset-1"
              )}
              title={color.label}
            >
              {value === color.value && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface SelectOption {
  id: string;
  label: string;
  color?: string;
}

export function SelectCell({
  value,
  options,
  onChange,
  onAddOption,
  onUpdateOption,
  compact = false,
  className,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  onAddOption?: (option: SelectOption) => void;
  onUpdateOption?: (option: SelectOption) => void;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("BoardComponents.cells.select");
  const optionColors = getOptionColors(t);
  const [open, setOpen] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState(optionColors[0].value);
  const selectedOption = options.find((o) => o.id === value);

  const handleAddOption = () => {
    if (!newOptionLabel.trim() || !onAddOption) return;
    const newOption: SelectOption = {
      id: crypto.randomUUID(),
      label: newOptionLabel.trim(),
      color: newOptionColor,
    };
    onAddOption(newOption);
    onChange(newOption.id); // Auto-select new option
    setNewOptionLabel("");
    setNewOptionColor(optionColors[0].value);
  };

  const handleUpdateOptionColor = (optionId: string, newColor: string) => {
    if (!onUpdateOption) return;
    const option = options.find((o) => o.id === optionId);
    if (option) {
      onUpdateOption({ ...option, color: newColor });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-sm text-left w-full flex-wrap",
            compact ? "py-0.5 min-h-[24px]" : "py-0.5 min-h-[28px]",
            className
          )}
        >
          {selectedOption ? (
            <Badge
              variant="secondary"
              className={cn("font-normal text-xs px-1.5 py-0", selectedOption.color)}
            >
              {selectedOption.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground/40"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="space-y-0.5">
          {options.map((option) => (
            <div
              key={option.id}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors group",
                value === option.id && "bg-accent"
              )}
            >
              {/* Color picker for existing option */}
              {onUpdateOption && (
                <ColorPicker
                  value={option.color || optionColors[0].value}
                  onChange={(color) => handleUpdateOptionColor(option.id, color)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  optionColors={optionColors}
                />
              )}
              <button
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className="flex-1 flex items-center gap-2"
              >
                <Badge variant="secondary" className={cn("font-normal", option.color)}>
                  {option.label}
                </Badge>
              </button>
              {value === option.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          ))}

          {/* Add new option */}
          {onAddOption && (
            <>
              <div className="border-t my-1" />
              <div className="flex items-center gap-1.5 px-1">
                <ColorPicker
                  value={newOptionColor}
                  onChange={setNewOptionColor}
                  optionColors={optionColors}
                />
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder={t("addNew")}
                  className="flex-1 text-sm px-2 py-1.5 bg-transparent border-none outline-none focus:ring-0"
                />
                {newOptionLabel.trim() && (
                  <button
                    onClick={handleAddOption}
                    className="p-1 text-primary hover:bg-accent rounded"
                    title={t("addNew")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}

          {value && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground text-left rounded hover:bg-accent transition-colors"
              >
                {t("delete")}
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function MultiSelectCell({
  value,
  options,
  onChange,
  onAddOption,
  onUpdateOption,
  compact = false,
  className,
}: {
  value: string[];
  options: SelectOption[];
  onChange: (v: string[]) => void;
  onAddOption?: (option: SelectOption) => void;
  onUpdateOption?: (option: SelectOption) => void;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("BoardComponents.cells.select");
  const optionColors = getOptionColors(t);
  const [open, setOpen] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState(optionColors[0].value);
  const selectedOptions = options.filter((o) => value.includes(o.id));

  const toggleOption = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((v) => v !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  const handleAddOption = () => {
    if (!newOptionLabel.trim() || !onAddOption) return;
    const newOption: SelectOption = {
      id: crypto.randomUUID(),
      label: newOptionLabel.trim(),
      color: newOptionColor,
    };
    onAddOption(newOption);
    onChange([...value, newOption.id]); // Auto-select new option
    setNewOptionLabel("");
    setNewOptionColor(optionColors[0].value);
  };

  const handleUpdateOptionColor = (optionId: string, newColor: string) => {
    if (!onUpdateOption) return;
    const option = options.find((o) => o.id === optionId);
    if (option) {
      onUpdateOption({ ...option, color: newColor });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-0.5 text-sm text-left w-full flex-wrap",
            compact ? "py-0.5 min-h-[24px]" : "py-0.5 min-h-[28px]",
            className
          )}
        >
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <Badge
                key={option.id}
                variant="secondary"
                className={cn("font-normal text-xs px-1.5 py-0", option.color)}
              >
                {option.label}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground/40"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="space-y-0.5">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors group"
            >
              {/* Color picker for existing option */}
              {onUpdateOption && (
                <ColorPicker
                  value={option.color || optionColors[0].value}
                  onChange={(color) => handleUpdateOptionColor(option.id, color)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  optionColors={optionColors}
                />
              )}
              <button
                onClick={() => toggleOption(option.id)}
                className="flex-1 flex items-center gap-2"
              >
                <div
                  className={cn(
                    "h-4 w-4 border rounded flex items-center justify-center",
                    value.includes(option.id) ? "bg-primary border-primary" : "border-input"
                  )}
                >
                  {value.includes(option.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <Badge variant="secondary" className={cn("font-normal", option.color)}>
                  {option.label}
                </Badge>
              </button>
            </div>
          ))}

          {/* Add new option */}
          {onAddOption && (
            <>
              <div className="border-t my-1" />
              <div className="flex items-center gap-1.5 px-1">
                <ColorPicker
                  value={newOptionColor}
                  onChange={setNewOptionColor}
                  optionColors={optionColors}
                />
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder={t("addNew")}
                  className="flex-1 text-sm px-2 py-1.5 bg-transparent border-none outline-none focus:ring-0"
                />
                {newOptionLabel.trim() && (
                  <button
                    onClick={handleAddOption}
                    className="p-1 text-primary hover:bg-accent rounded"
                    title={t("addNew")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
