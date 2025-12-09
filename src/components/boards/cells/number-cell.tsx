"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

export function NumberCell({
  value,
  onChange,
  compact = false,
  className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  compact?: boolean;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue === "") {
      onChange(null);
    } else {
      const num = parseFloat(inputValue);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("h-full w-full px-2 py-1", className)}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => {
        setIsEditing(true);
        setInputValue(value?.toString() ?? "");
      }}
      className={cn(
        "w-full cursor-text hover:bg-muted/50 rounded px-2",
        compact ? "py-0.5" : "py-1",
        !value && value !== 0 && "h-6",
        className
      )}
    >
      {value || value === 0 ? value : <span className="text-muted-foreground/40"></span>}
    </div>
  );
}

export function CurrencyCell({
  value,
  onChange,
  compact = false,
  className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  compact?: boolean;
  className?: string; // Add className prop
}) {
  const locale = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const formatCurrency = (num: number) => {
    if (!num && num !== 0) return "";
    // Dynamically format based on locale
    return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(num);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue === "") {
      onChange(null);
    } else {
      const num = parseFloat(inputValue);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("h-full w-full px-2 py-1", className)}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => {
        setIsEditing(true);
        setInputValue(value?.toString() ?? "");
      }}
      className={cn(
        "w-full cursor-text hover:bg-muted/50 rounded px-2 text-right font-mono", // Add font-mono for better alignment
        compact ? "py-0.5" : "py-1",
        !value && value !== 0 && "h-6",
        className
      )}
    >
      {value || value === 0 ? (
        `${formatCurrency(value)} ${locale === "vi" ? "₫" : "$"}`
      ) : (
        <span className="text-muted-foreground/40"></span>
      )}
    </div>
  );
}
