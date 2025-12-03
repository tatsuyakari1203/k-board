"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Check, Plus, X, Paperclip, Upload, FileText, Image as ImageIcon, Clock, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { type Property, PropertyType } from "@/types/board";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

// Color palette for options
const OPTION_COLORS = [
  { value: "bg-gray-100 text-gray-800", label: "Xám", preview: "bg-gray-400" },
  { value: "bg-red-100 text-red-800", label: "Đỏ", preview: "bg-red-400" },
  { value: "bg-orange-100 text-orange-800", label: "Cam", preview: "bg-orange-400" },
  { value: "bg-yellow-100 text-yellow-800", label: "Vàng", preview: "bg-yellow-400" },
  { value: "bg-green-100 text-green-800", label: "Xanh lá", preview: "bg-green-400" },
  { value: "bg-teal-100 text-teal-800", label: "Xanh ngọc", preview: "bg-teal-400" },
  { value: "bg-blue-100 text-blue-800", label: "Xanh dương", preview: "bg-blue-400" },
  { value: "bg-indigo-100 text-indigo-800", label: "Chàm", preview: "bg-indigo-400" },
  { value: "bg-purple-100 text-purple-800", label: "Tím", preview: "bg-purple-400" },
  { value: "bg-pink-100 text-pink-800", label: "Hồng", preview: "bg-pink-400" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRandomColor() {
  return OPTION_COLORS[Math.floor(Math.random() * OPTION_COLORS.length)].value;
}

// Color Picker Component
function ColorPicker({
  value,
  onChange,
  className
}: {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentColor = OPTION_COLORS.find(c => c.value === value) || OPTION_COLORS[0];

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
          {OPTION_COLORS.map((color) => (
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

interface SelectOption {
  id: string;
  label: string;
  color?: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AttachmentFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface PropertyCellProps {
  property: Property;
  value: unknown;
  onChange: (value: unknown) => void;
  onAddOption?: (propertyId: string, option: SelectOption) => void;
  onUpdateOption?: (propertyId: string, option: SelectOption) => void;
  users?: UserOption[];
  compact?: boolean;
  className?: string;
}

export function PropertyCell({ property, value, onChange, onAddOption, onUpdateOption, users = [], compact = false, className }: PropertyCellProps) {
  switch (property.type) {
    case PropertyType.TEXT:
      return <TextCell value={value as string} onChange={onChange} compact={compact} className={className} />;

    case PropertyType.NUMBER:
      return <NumberCell value={value as number} onChange={onChange} compact={compact} className={className} />;

    case PropertyType.DATE:
      return <DateCell value={value as string} onChange={onChange} compact={compact} className={className} />;

    case PropertyType.SELECT:
    case PropertyType.STATUS:
      return (
        <SelectCell
          value={value as string}
          options={property.options || []}
          onChange={onChange}
          onAddOption={onAddOption ? (opt) => onAddOption(property.id, opt) : undefined}
          onUpdateOption={onUpdateOption ? (opt) => onUpdateOption(property.id, opt) : undefined}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.MULTI_SELECT:
      return (
        <MultiSelectCell
          value={(value as string[]) || []}
          options={property.options || []}
          onChange={onChange}
          onAddOption={onAddOption ? (opt) => onAddOption(property.id, opt) : undefined}
          onUpdateOption={onUpdateOption ? (opt) => onUpdateOption(property.id, opt) : undefined}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.CURRENCY:
      return <CurrencyCell value={value as number} onChange={onChange} compact={compact} className={className} />;

    case PropertyType.CHECKBOX:
      return <CheckboxCell value={value as boolean} onChange={onChange} className={className} />;

    case PropertyType.PERSON:
      return <UserCell value={value as string} users={users} onChange={onChange} compact={compact} className={className} multiSelect={false} />;

    case PropertyType.USER:
      return <UserCell value={value as string | string[]} users={users} onChange={onChange} compact={compact} className={className} multiSelect={true} />;

    case PropertyType.ATTACHMENT:
      return <AttachmentCell value={(value as AttachmentFile[]) || []} onChange={onChange} compact={compact} className={className} />;

    default:
      return <TextCell value={value as string} onChange={onChange} compact={compact} className={className} />;
  }
}

// ============================================
// TEXT CELL
// ============================================

function TextCell({
  value,
  onChange,
  compact = false,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value || ""}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }}
      rows={1}
      className={cn(
        "w-full bg-transparent border-none outline-none text-sm focus:ring-0 resize-none overflow-hidden placeholder:text-muted-foreground/40",
        compact ? "py-0.5 px-0" : "py-0 px-0",
        className
      )}
      placeholder=""
      style={{ height: "auto" }}
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
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
      className={cn(
        "w-full bg-transparent border-none outline-none text-sm focus:ring-0 placeholder:text-muted-foreground/40",
        compact ? "py-0.5 px-0" : "py-1 px-0",
        className
      )}
      placeholder=""
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
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
  className?: string;
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
          compact ? "py-0.5 px-0" : "py-1 px-0",
          className
        )}
      />
    );
  }

  return (
    <div
      onClick={handleFocus}
      className={cn(
        "text-sm cursor-text flex items-center",
        compact ? "py-0.5 min-h-[24px]" : "py-1 min-h-[28px]",
        className
      )}
    >
      {value ? `${formatCurrency(value)} ₫` : <span className="text-muted-foreground/40"></span>}
    </div>
  );
}

// ============================================
// DATE CELL
// ============================================

interface DateValue {
  from: string | null;
  to: string | null;
  hasTime: boolean;
}

function parseDateValue(value: unknown): DateValue {
  if (!value) return { from: null, to: null, hasTime: false };

  if (typeof value === 'string') {
    // Legacy support for simple ISO string
    return {
      from: value,
      to: null,
      hasTime: value.includes('T') && !value.endsWith('T00:00:00.000Z')
    };
  }

  // Assume it's the new object structure
  const val = value as Record<string, unknown>;
  return {
    from: (val.from as string) || null,
    to: (val.to as string) || null,
    hasTime: !!val.hasTime
  };
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted-foreground/20"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-3 w-3 rounded-full bg-background shadow-sm ring-0 transition-transform",
          checked ? "translate-x-3" : "translate-x-0"
        )}
      />
    </button>
  )
}

function DateCell({
  value,
  onChange,
  compact = false,
  className,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dateValue = parseDateValue(value);

  const [isRange, setIsRange] = useState(!!dateValue.to);
  const [includeTime, setIncludeTime] = useState(dateValue.hasTime);

  // Local state for the picker
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: dateValue.from ? new Date(dateValue.from) : undefined,
    to: dateValue.to ? new Date(dateValue.to) : undefined,
  });

  // Time state
  const [startTime, setStartTime] = useState(dateValue.from ? format(new Date(dateValue.from), "HH:mm") : "09:00");
  const [endTime, setEndTime] = useState(dateValue.to ? format(new Date(dateValue.to), "HH:mm") : "17:00");

  // Sync state when value or open changes
  useEffect(() => {
    const parsed = parseDateValue(value);
    setSelectedRange({ // eslint-disable-line react-hooks/set-state-in-effect
      from: parsed.from ? new Date(parsed.from) : undefined,
      to: parsed.to ? new Date(parsed.to) : undefined,
    });
    setIsRange(!!parsed.to);
    setIncludeTime(parsed.hasTime);
    if (parsed.from) setStartTime(format(new Date(parsed.from), "HH:mm"));
    if (parsed.to) setEndTime(format(new Date(parsed.to), "HH:mm"));
  }, [value, open]);

  const handleSave = (range: DateRange | undefined, withTime: boolean, startT: string, endT: string) => {
    if (!range?.from) {
      onChange(null);
      return;
    }

    const fromDate = new Date(range.from);
    const toDate = range.to ? new Date(range.to) : null;

    if (withTime) {
      const [startH, startM] = startT.split(":").map(Number);
      fromDate.setHours(startH, startM);

      if (toDate) {
        const [endH, endM] = endT.split(":").map(Number);
        toDate.setHours(endH, endM);
      }
    } else {
      fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(0, 0, 0, 0);
    }

    const newValue: DateValue = {
      from: fromDate.toISOString(),
      to: toDate ? toDate.toISOString() : null,
      hasTime: withTime
    };

    onChange(newValue);
  };

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    handleSave(range, includeTime, startTime, endTime);
  };

  const toggleRange = (checked: boolean) => {
    setIsRange(checked);
    if (!selectedRange?.from) return;
    const newRange: DateRange = {
      from: selectedRange.from,
      to: checked ? selectedRange.to : undefined
    };
    setSelectedRange(newRange);
    handleSave(newRange, includeTime, startTime, endTime);
  };

  const toggleTime = (checked: boolean) => {
    setIncludeTime(checked);
    handleSave(selectedRange, checked, startTime, endTime);
  };

  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') {
      setStartTime(val);
      handleSave(selectedRange, includeTime, val, endTime);
    } else {
      setEndTime(val);
      handleSave(selectedRange, includeTime, startTime, val);
    }
  };

  const formatDateDisplay = () => {
    if (!dateValue.from) return <span>—</span>;

    const fromDate = new Date(dateValue.from);
    const dateFormat = "dd/MM/yyyy";
    const timeFormat = "HH:mm";

    const fromStr = format(fromDate, dateFormat + (dateValue.hasTime ? ` ${timeFormat}` : ""), { locale: vi });

    if (dateValue.to) {
      const toDate = new Date(dateValue.to);
      const toStr = format(toDate, dateFormat + (dateValue.hasTime ? ` ${timeFormat}` : ""), { locale: vi });
      return (
        <span className="flex items-center gap-1">
          <span>{fromStr}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span>{toStr}</span>
        </span>
      );
    }

    return <span>{fromStr}</span>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-sm text-left w-full flex-wrap",
            compact ? "py-0.5" : "py-1",
            !dateValue.from && "text-muted-foreground/40",
            className
          )}
        >
          <CalendarIcon className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
          <span className="text-xs">{formatDateDisplay()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Ngày</div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        className="w-24 text-xs border rounded px-1 py-0.5 bg-background"
                        value={selectedRange?.from ? format(selectedRange.from, "dd/MM/yyyy") : ""}
                        readOnly
                        placeholder="Start"
                    />
                    {isRange && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    {isRange && (
                        <input
                            type="text"
                            className="w-24 text-xs border rounded px-1 py-0.5 bg-background"
                            value={selectedRange?.to ? format(selectedRange.to, "dd/MM/yyyy") : ""}
                            readOnly
                            placeholder="End"
                        />
                    )}
                </div>
            </div>
            {isRange ? (
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(val) => handleSelect(val as DateRange)}
              locale={vi}
              initialFocus
            />
            ) : (
            <Calendar
              mode="single"
              selected={selectedRange?.from}
              onSelect={(val) => handleSelect({ from: val as Date, to: undefined })}
              locale={vi}
              initialFocus
            />
            )}
        </div>

        <div className="p-3 space-y-3 bg-muted/10">
            {/* Options */}
            <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Ngày kết thúc</label>
                <Switch checked={isRange} onCheckedChange={toggleRange} />
            </div>

            <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Bao gồm giờ</label>
                <Switch checked={includeTime} onCheckedChange={toggleTime} />
            </div>

            {includeTime && (
                <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1">
                        <label className="text-xs text-muted-foreground block mb-1">Giờ bắt đầu</label>
                        <div className="relative">
                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => handleTimeChange('start', e.target.value)}
                                className="w-full pl-7 pr-2 py-1 text-sm border rounded bg-background"
                            />
                        </div>
                    </div>
                    {isRange && (
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground block mb-1">Giờ kết thúc</label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => handleTimeChange('end', e.target.value)}
                                    className="w-full pl-7 pr-2 py-1 text-sm border rounded bg-background"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="pt-2 border-t flex items-center justify-between">
                <button
                    onClick={() => {
                        onChange(null);
                        setOpen(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Xóa
                </button>
                <div className="text-xs text-muted-foreground">
                    GMT+7
                </div>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// SELECT CELL
// ============================================

function SelectCell({
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
  const [open, setOpen] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState(OPTION_COLORS[0].value);
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
    setNewOptionColor(OPTION_COLORS[0].value);
  };

  const handleUpdateOptionColor = (optionId: string, newColor: string) => {
    if (!onUpdateOption) return;
    const option = options.find(o => o.id === optionId);
    if (option) {
      onUpdateOption({ ...option, color: newColor });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1 text-sm text-left w-full flex-wrap",
          compact ? "py-0.5 min-h-[24px]" : "py-0.5 min-h-[28px]",
          className
        )}>
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
                  value={option.color || OPTION_COLORS[0].value}
                  onChange={(color) => handleUpdateOptionColor(option.id, color)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
              <button
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className="flex-1 flex items-center gap-2"
              >
                <Badge
                  variant="secondary"
                  className={cn("font-normal", option.color)}
                >
                  {option.label}
                </Badge>
              </button>
              {value === option.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
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
                  placeholder="Thêm mới..."
                  className="flex-1 text-sm px-2 py-1.5 bg-transparent border-none outline-none focus:ring-0"
                />
                {newOptionLabel.trim() && (
                  <button
                    onClick={handleAddOption}
                    className="p-1 text-primary hover:bg-accent rounded"
                    title="Thêm"
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
  const [open, setOpen] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState(OPTION_COLORS[0].value);
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
    setNewOptionColor(OPTION_COLORS[0].value);
  };

  const handleUpdateOptionColor = (optionId: string, newColor: string) => {
    if (!onUpdateOption) return;
    const option = options.find(o => o.id === optionId);
    if (option) {
      onUpdateOption({ ...option, color: newColor });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-0.5 text-sm text-left w-full flex-wrap",
          compact ? "py-0.5 min-h-[24px]" : "py-0.5 min-h-[28px]",
          className
        )}>
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
                  value={option.color || OPTION_COLORS[0].value}
                  onChange={(color) => handleUpdateOptionColor(option.id, color)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
              <button
                onClick={() => toggleOption(option.id)}
                className="flex-1 flex items-center gap-2"
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
                  placeholder="Thêm mới..."
                  className="flex-1 text-sm px-2 py-1.5 bg-transparent border-none outline-none focus:ring-0"
                />
                {newOptionLabel.trim() && (
                  <button
                    onClick={handleAddOption}
                    className="p-1 text-primary hover:bg-accent rounded"
                    title="Thêm"
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

// ============================================
// CHECKBOX CELL
// ============================================

function CheckboxCell({
  value,
  onChange,
  className,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center h-full", className)}>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "h-3.5 w-3.5 border rounded-sm flex items-center justify-center transition-colors",
          value ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-muted-foreground/50"
        )}
      >
        {value && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
      </button>
    </div>
  );
}

// ============================================
// USER CELL - Select user(s) from list
// ============================================

function UserCell({
  value,
  users,
  onChange,
  compact = false,
  className,
  multiSelect = true,
}: {
  value: string | string[];
  users: UserOption[];
  onChange: (v: string | string[]) => void;
  compact?: boolean;
  className?: string;
  multiSelect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Normalize value to array for easier handling
  const valueArray = Array.isArray(value) ? value : (value ? [value] : []);
  const selectedUsers = users.filter((u) => valueArray.includes(u.id));

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (multiSelect) {
      // Multi-select mode
      if (valueArray.includes(userId)) {
        onChange(valueArray.filter((id) => id !== userId));
      } else {
        onChange([...valueArray, userId]);
      }
    } else {
      // Single select mode
      onChange(userId);
      setOpen(false);
      setSearch("");
    }
  };

  const clearAll = () => {
    onChange(multiSelect ? [] : "");
    setOpen(false);
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
          {selectedUsers.length > 0 ? (
            <div className="flex items-center -space-x-1">
              {selectedUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-medium text-primary border-2 border-background"
                  title={user.name}
                >
                  {user.image ? (
                    <img src={user.image} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    user.name.split(" ").pop()?.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {selectedUsers.length > 4 && (
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground border-2 border-background">
                  +{selectedUsers.length - 4}
                </div>
              )}
              {selectedUsers.length === 1 && (
                <span className="text-xs ml-1.5">{selectedUsers[0].name}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground/40"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-1" align="start">
        <div className="space-y-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full text-sm px-2 py-1.5 bg-transparent border-b outline-none focus:ring-0"
          />

          {/* Selected users tags (only for multi-select) */}
          {multiSelect && selectedUsers.length > 0 && (
            <div className="px-2 py-1 border-b">
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors"
                  >
                    <span>{user.name}</span>
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors",
                    valueArray.includes(user.id) && "bg-accent"
                  )}
                >
                  {multiSelect && (
                    <div
                      className={cn(
                        "h-4 w-4 border rounded flex items-center justify-center flex-shrink-0",
                        valueArray.includes(user.id)
                          ? "bg-primary border-primary"
                          : "border-input"
                      )}
                    >
                      {valueArray.includes(user.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  )}
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                    {user.image ? (
                      <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      user.name.split(" ").pop()?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  {!multiSelect && valueArray.includes(user.id) && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {users.length === 0 ? "Chưa có user nào" : "Không tìm thấy"}
              </div>
            )}
          </div>

          {valueArray.length > 0 && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={clearAll}
                className="w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground text-left rounded hover:bg-accent transition-colors"
              >
                Xóa {multiSelect && selectedUsers.length > 1 ? "tất cả" : ""}
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// ATTACHMENT CELL - Upload files
// ============================================

function AttachmentCell({
  value,
  onChange,
  compact = false,
  className,
}: {
  value: AttachmentFile[];
  onChange: (v: AttachmentFile[]) => void;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles: AttachmentFile[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const fileInfo = await res.json();
          uploadedFiles.push(fileInfo);
        }
      }

      onChange([...value, ...uploadedFiles]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (fileId: string) => {
    onChange(value.filter((f) => f.id !== fileId));
  };

  const isImage = (type: string) => type.startsWith("image/");

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-sm text-left w-full",
            compact ? "py-0.5 min-h-[24px]" : "py-0.5 min-h-[28px]",
            className
          )}
        >
          {value.length > 0 ? (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-xs">{value.length}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/40"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="space-y-2">
          {/* File list */}
          {value.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {value.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-1.5 rounded bg-accent/50 group"
                >
                  {isImage(file.type) ? (
                    <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  )}
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-xs hover:underline"
                  >
                    <div className="truncate">{file.name}</div>
                    <div className="text-muted-foreground">{formatSize(file.size)}</div>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 w-full py-2 border border-dashed rounded text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Tải lên tệp</span>
              </>
            )}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
