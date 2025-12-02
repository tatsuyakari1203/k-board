"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { type Property, PropertyType } from "@/types/board";
import { cn } from "@/lib/utils";

interface PropertyCellProps {
  property: Property;
  value: unknown;
  onChange: (value: unknown) => void;
  compact?: boolean;
}

export function PropertyCell({ property, value, onChange, compact = false }: PropertyCellProps) {
  switch (property.type) {
    case PropertyType.TEXT:
      return <TextCell value={value as string} onChange={onChange} compact={compact} />;

    case PropertyType.NUMBER:
      return <NumberCell value={value as number} onChange={onChange} compact={compact} />;

    case PropertyType.DATE:
      return <DateCell value={value as string} onChange={onChange} compact={compact} />;

    case PropertyType.SELECT:
    case PropertyType.STATUS:
      return (
        <SelectCell
          value={value as string}
          options={property.options || []}
          onChange={onChange}
          compact={compact}
        />
      );

    case PropertyType.MULTI_SELECT:
      return (
        <MultiSelectCell
          value={(value as string[]) || []}
          options={property.options || []}
          onChange={onChange}
          compact={compact}
        />
      );

    case PropertyType.CURRENCY:
      return <CurrencyCell value={value as number} onChange={onChange} compact={compact} />;

    case PropertyType.CHECKBOX:
      return <CheckboxCell value={value as boolean} onChange={onChange} />;

    case PropertyType.PERSON:
      return <PersonCell value={value as string} onChange={onChange} compact={compact} />;

    default:
      return <TextCell value={value as string} onChange={onChange} compact={compact} />;
  }
}

// ============================================
// TEXT CELL
// ============================================

function TextCell({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full bg-transparent border-none outline-none text-sm focus:ring-0",
        compact ? "py-1 px-0" : "py-1.5 px-0"
      )}
      placeholder="—"
    />
  );
}

// ============================================
// NUMBER CELL
// ============================================

function NumberCell({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
      className={cn(
        "w-full bg-transparent border-none outline-none text-sm focus:ring-0",
        compact ? "py-1 px-0" : "py-1.5 px-0"
      )}
      placeholder="—"
    />
  );
}

// ============================================
// CURRENCY CELL
// ============================================

function CurrencyCell({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const formatCurrency = (num: number) => {
    if (!num && num !== 0) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const handleFocus = () => {
    setIsEditing(true);
    setInputValue(value?.toString() || "");
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue.replace(/[^\d.-]/g, ""));
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        autoFocus
        className={cn(
          "w-full bg-transparent border-none outline-none text-sm focus:ring-0",
          compact ? "py-1 px-0" : "py-1.5 px-0"
        )}
      />
    );
  }

  return (
    <div
      onClick={handleFocus}
      className={cn("text-sm cursor-text", compact ? "py-1 min-h-[28px]" : "py-1.5 min-h-[32px]")}
    >
      {value ? `${formatCurrency(value)} ₫` : <span className="text-muted-foreground">—</span>}
    </div>
  );
}

// ============================================
// DATE CELL
// ============================================

function DateCell({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 text-sm text-left w-full",
            compact ? "py-1" : "py-1.5",
            !date && "text-muted-foreground"
          )}
        >
          {date ? (
            format(date, "dd/MM/yyyy", { locale: vi })
          ) : (
            <span>—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            onChange(newDate?.toISOString() || "");
            setOpen(false);
          }}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// SELECT CELL
// ============================================

interface SelectOption {
  id: string;
  label: string;
  color?: string;
}

function SelectCell({
  value,
  options,
  onChange,
  compact = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1 text-sm text-left w-full",
          compact ? "py-0.5 min-h-[28px]" : "py-1 min-h-[32px]"
        )}>
          {selectedOption ? (
            <Badge
              variant="secondary"
              className={cn("font-normal text-xs", selectedOption.color)}
            >
              {selectedOption.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-0.5">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors",
                value === option.id && "bg-accent"
              )}
            >
              <Badge
                variant="secondary"
                className={cn("font-normal", option.color)}
              >
                {option.label}
              </Badge>
              {value === option.id && (
                <Check className="h-4 w-4 ml-auto text-primary" />
              )}
            </button>
          ))}
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
                Xóa
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// MULTI-SELECT CELL
// ============================================

function MultiSelectCell({
  value,
  options,
  onChange,
  compact = false,
}: {
  value: string[];
  options: SelectOption[];
  onChange: (v: string[]) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOptions = options.filter((o) => value.includes(o.id));

  const toggleOption = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((v) => v !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1 text-sm text-left w-full flex-wrap",
          compact ? "py-0.5 min-h-[28px]" : "py-1 min-h-[32px]"
        )}>
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <Badge
                key={option.id}
                variant="secondary"
                className={cn("font-normal", option.color)}
              >
                {option.label}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-0.5">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
            >
              <div
                className={cn(
                  "h-4 w-4 border rounded flex items-center justify-center",
                  value.includes(option.id)
                    ? "bg-primary border-primary"
                    : "border-input"
                )}
              >
                {value.includes(option.id) && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <Badge
                variant="secondary"
                className={cn("font-normal", option.color)}
              >
                {option.label}
              </Badge>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// CHECKBOX CELL
// ============================================

function CheckboxCell({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "h-4 w-4 border rounded flex items-center justify-center transition-colors",
        value ? "bg-primary border-primary" : "border-input hover:border-primary"
      )}
    >
      {value && <Check className="h-3 w-3 text-primary-foreground" />}
    </button>
  );
}

// ============================================
// PERSON CELL (placeholder)
// ============================================

function PersonCell({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  // TODO: Implement person picker with user list
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full bg-transparent border-none outline-none text-sm focus:ring-0",
        compact ? "py-1 px-0" : "py-1.5 px-0"
      )}
      placeholder="—"
    />
  );
}
