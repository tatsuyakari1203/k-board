"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function TextCell({
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
