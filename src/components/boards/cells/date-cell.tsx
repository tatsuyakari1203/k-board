"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useTranslations, useLocale } from "next-intl";

interface DateValue {
  from: string | null;
  to: string | null;
  hasTime: boolean;
}

function parseDateValue(value: unknown): DateValue {
  if (!value) return { from: null, to: null, hasTime: false };

  if (typeof value === "string") {
    // Legacy support for simple ISO string
    return {
      from: value,
      to: null,
      hasTime: value.includes("T") && !value.endsWith("T00:00:00.000Z"),
    };
  }

  // Assume it's the new object structure
  const val = value as Record<string, unknown>;
  return {
    from: (val.from as string) || null,
    to: (val.to as string) || null,
    hasTime: !!val.hasTime,
  };
}

function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
}) {
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
  );
}

export function DateCell({
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
  const t = useTranslations("BoardComponents.cells.date");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const dateValue = parseDateValue(value);

  const dateFnsLocale = locale === "vi" ? vi : enUS;

  const [isRange, setIsRange] = useState(!!dateValue.to);
  const [includeTime, setIncludeTime] = useState(dateValue.hasTime);

  // Local state for the picker
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: dateValue.from ? new Date(dateValue.from) : undefined,
    to: dateValue.to ? new Date(dateValue.to) : undefined,
  });

  // Time state
  const [startTime, setStartTime] = useState(
    dateValue.from ? format(new Date(dateValue.from), "HH:mm") : "09:00"
  );
  const [endTime, setEndTime] = useState(
    dateValue.to ? format(new Date(dateValue.to), "HH:mm") : "17:00"
  );

  // Sync state when popover opens - this is intentional to reset picker state
  useEffect(() => {
    if (open) {
      const parsed = parseDateValue(value);
      setSelectedRange({
        from: parsed.from ? new Date(parsed.from) : undefined,
        to: parsed.to ? new Date(parsed.to) : undefined,
      });
      setIsRange(!!parsed.to);
      setIncludeTime(parsed.hasTime);
      if (parsed.from) setStartTime(format(new Date(parsed.from), "HH:mm"));
      if (parsed.to) setEndTime(format(new Date(parsed.to), "HH:mm"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = (
    range: DateRange | undefined,
    withTime: boolean,
    startT: string,
    endT: string
  ) => {
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
      hasTime: withTime,
    };

    onChange(newValue);
  };

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    handleSave(range, includeTime, startTime, endTime);
  };

  const toggleRange = (checked: boolean) => {
    setIsRange(checked);

    // Allow toggling range even if no date is selected yet
    const newRange: DateRange = {
      from: selectedRange?.from,
      to: checked ? selectedRange?.to : undefined,
    };
    setSelectedRange(newRange);
    handleSave(newRange, includeTime, startTime, endTime);
  };

  const toggleTime = (checked: boolean) => {
    setIncludeTime(checked);
    handleSave(selectedRange, checked, startTime, endTime);
  };

  const handleTimeChange = (type: "start" | "end", val: string) => {
    if (type === "start") {
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

    const fromStr = format(fromDate, dateFormat + (dateValue.hasTime ? ` ${timeFormat}` : ""), {
      locale: dateFnsLocale,
    });

    if (dateValue.to) {
      const toDate = new Date(dateValue.to);
      const toStr = format(toDate, dateFormat + (dateValue.hasTime ? ` ${timeFormat}` : ""), {
        locale: dateFnsLocale,
      });
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
            <div className="text-sm font-medium">{t("dateLabel")}</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="w-24 text-xs border rounded px-1 py-0.5 bg-background"
                value={selectedRange?.from ? format(selectedRange.from, "dd/MM/yyyy") : ""}
                readOnly
                placeholder={t("start")}
              />
              {isRange && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              {isRange && (
                <input
                  type="text"
                  className="w-24 text-xs border rounded px-1 py-0.5 bg-background"
                  value={selectedRange?.to ? format(selectedRange.to, "dd/MM/yyyy") : ""}
                  readOnly
                  placeholder={t("end")}
                />
              )}
            </div>
          </div>
          {isRange ? (
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(val) => handleSelect(val as DateRange)}
              locale={dateFnsLocale}
              initialFocus
            />
          ) : (
            <Calendar
              mode="single"
              selected={selectedRange?.from}
              onSelect={(val) => handleSelect({ from: val as Date, to: undefined })}
              locale={dateFnsLocale}
              initialFocus
            />
          )}
        </div>

        <div className="p-3 space-y-3 bg-muted/10">
          {/* Options */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">{t("endDateLabel")}</label>
            <Switch checked={isRange} onCheckedChange={toggleRange} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">{t("includeTime")}</label>
            <Switch checked={includeTime} onCheckedChange={toggleTime} />
          </div>

          {includeTime && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">{t("startTime")}</label>
                <div className="relative">
                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleTimeChange("start", e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-sm border rounded bg-background"
                  />
                </div>
              </div>
              {isRange && (
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">{t("endTime")}</label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleTimeChange("end", e.target.value)}
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
              {t("clear")}
            </button>
            <div className="text-xs text-muted-foreground">GMT+7</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
