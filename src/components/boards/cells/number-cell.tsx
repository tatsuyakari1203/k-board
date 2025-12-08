"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function NumberCell({
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

export function CurrencyCell({
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
