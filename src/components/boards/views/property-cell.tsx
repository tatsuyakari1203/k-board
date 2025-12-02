"use client";

import { useState, useRef, useEffect } from "react";
import { format, isValid, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Check, Plus, X, Paperclip, Upload, FileText, Image as ImageIcon, User as UserIcon, Clock, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
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

// Random color for new options
const OPTION_COLORS = [
  "bg-gray-100 text-gray-800",
  "bg-red-100 text-red-800",
  "bg-orange-100 text-orange-800",
  "bg-yellow-100 text-yellow-800",
  "bg-green-100 text-green-800",
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
];

function getRandomColor() {
  return OPTION_COLORS[Math.floor(Math.random() * OPTION_COLORS.length)];
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
  users?: UserOption[];
  compact?: boolean;
}

export function PropertyCell({ property, value, onChange, onAddOption, users = [], compact = false }: PropertyCellProps) {
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
          onAddOption={onAddOption ? (opt) => onAddOption(property.id, opt) : undefined}
          compact={compact}
        />
      );

    case PropertyType.MULTI_SELECT:
      return (
        <MultiSelectCell
          value={(value as string[]) || []}
          options={property.options || []}
          onChange={onChange}
          onAddOption={onAddOption ? (opt) => onAddOption(property.id, opt) : undefined}
          compact={compact}
        />
      );

    case PropertyType.CURRENCY:
      return <CurrencyCell value={value as number} onChange={onChange} compact={compact} />;

    case PropertyType.CHECKBOX:
      return <CheckboxCell value={value as boolean} onChange={onChange} />;

    case PropertyType.PERSON:
    case PropertyType.USER:
      return <UserCell value={value as string} users={users} onChange={onChange} compact={compact} />;

    case PropertyType.ATTACHMENT:
      return <AttachmentCell value={(value as AttachmentFile[]) || []} onChange={onChange} compact={compact} />;

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
  const val = value as any;
  return {
    from: val.from || null,
    to: val.to || null,
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
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

function DateCell({
  value,
  onChange,
  compact = false,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  compact?: boolean;
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

  useEffect(() => {
    const parsed = parseDateValue(value);
    setSelectedRange({
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

    let fromDate = new Date(range.from);
    let toDate = range.to ? new Date(range.to) : null;

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
    // Auto save if not range mode or if range is complete (or just start selected in range mode)
    // Actually for better UX, let's save immediately but keep popover open?
    // Or maybe just update local state and have a "Done" or auto-save on close?
    // Notion saves immediately.

    // If we are in single mode, range.to is undefined.
    // If we are in range mode, we wait for both? No, Notion updates as you click.

    handleSave(range, includeTime, startTime, endTime);
  };

  const toggleRange = (checked: boolean) => {
    setIsRange(checked);
    const newRange = { ...selectedRange, to: checked ? selectedRange?.to : undefined };
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
            "flex items-center gap-1.5 text-sm text-left w-full truncate",
            compact ? "py-1" : "py-1.5",
            !dateValue.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{formatDateDisplay()}</span>
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
            <Calendar
            mode={isRange ? "range" : "single"}
            selected={isRange ? selectedRange : selectedRange?.from}
            onSelect={(val) => {
                if (isRange) {
                    handleSelect(val as DateRange);
                } else {
                    handleSelect({ from: val as Date, to: undefined });
                }
            }}
            locale={vi}
            initialFocus
            />
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
  compact = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  onAddOption?: (option: SelectOption) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const selectedOption = options.find((o) => o.id === value);

  const handleAddOption = () => {
    if (!newOptionLabel.trim() || !onAddOption) return;
    const newOption: SelectOption = {
      id: crypto.randomUUID(),
      label: newOptionLabel.trim(),
      color: getRandomColor(),
    };
    onAddOption(newOption);
    onChange(newOption.id); // Auto-select new option
    setNewOptionLabel("");
  };

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
      <PopoverContent className="w-52 p-1" align="start">
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

          {/* Add new option */}
          {onAddOption && (
            <>
              <div className="border-t my-1" />
              <div className="flex items-center gap-1 px-1">
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
  compact = false,
}: {
  value: string[];
  options: SelectOption[];
  onChange: (v: string[]) => void;
  onAddOption?: (option: SelectOption) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
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
      color: getRandomColor(),
    };
    onAddOption(newOption);
    onChange([...value, newOption.id]); // Auto-select new option
    setNewOptionLabel("");
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
      <PopoverContent className="w-52 p-1" align="start">
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

          {/* Add new option */}
          {onAddOption && (
            <>
              <div className="border-t my-1" />
              <div className="flex items-center gap-1 px-1">
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
// USER CELL - Select user from list
// ============================================

function UserCell({
  value,
  users,
  onChange,
  compact = false,
}: {
  value: string;
  users: UserOption[];
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedUser = users.find((u) => u.id === value);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 text-sm text-left w-full",
            compact ? "py-0.5 min-h-[28px]" : "py-1 min-h-[32px]"
          )}
        >
          {selectedUser ? (
            <>
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {selectedUser.image ? (
                  <img src={selectedUser.image} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  selectedUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="truncate">{selectedUser.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="space-y-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full text-sm px-2 py-1.5 bg-transparent border-b outline-none focus:ring-0"
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onChange(user.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors",
                    value === user.id && "bg-accent"
                  )}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                    {user.image ? (
                      <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  {value === user.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </button>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {users.length === 0 ? "Chưa có user nào" : "Không tìm thấy"}
              </div>
            )}
          </div>
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
// ATTACHMENT CELL - Upload files
// ============================================

function AttachmentCell({
  value,
  onChange,
  compact = false,
}: {
  value: AttachmentFile[];
  onChange: (v: AttachmentFile[]) => void;
  compact?: boolean;
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
            "flex items-center gap-1.5 text-sm text-left w-full",
            compact ? "py-0.5 min-h-[28px]" : "py-1 min-h-[32px]"
          )}
        >
          {value.length > 0 ? (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{value.length} tệp</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
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
