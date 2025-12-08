"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckboxCell({
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
          value
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-muted-foreground/50"
        )}
      >
        {value && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
      </button>
    </div>
  );
}
