"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface Aggregation {
  type: "count" | "sum" | "average" | "min" | "max";
  value: number;
  label?: string;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  color?: string;
  count: number;
  aggregations?: Aggregation[];
  isOver?: boolean;
  children: React.ReactNode;
  onAddCard?: () => void;
}

// Parse color from PropertyCell format
function parseColorName(color: string | undefined): string {
  if (!color) return "gray";
  const simpleColors = ["gray", "red", "orange", "yellow", "green", "teal", "blue", "indigo", "purple", "pink"];
  if (simpleColors.includes(color)) return color;
  const match = color.match(/bg-(\w+)-\d+/);
  if (match && match[1]) return match[1];
  return "gray";
}

// Minimal dot colors for Notion-style
const dotColors: Record<string, string> = {
  gray: "bg-gray-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

// ============================================
// COMPONENT
// ============================================

// Format number for display
function formatAggregationValue(type: Aggregation["type"], value: number): string {
  if (type === "count") return value.toString();
  if (Number.isInteger(value)) return value.toLocaleString("vi-VN");
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  aggregations = [],
  isOver,
  children,
  onAddCard,
}: KanbanColumnProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { setNodeRef, isOver: isDndOver } = useDroppable({ id });
  const isDropTarget = isOver || isDndOver;
  const colorName = parseColorName(color);
  const dotColor = dotColors[colorName] || dotColors.gray;

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-[280px] min-w-[280px] md:w-[280px] md:min-w-[280px] w-[240px] min-w-[240px] shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column Header - Notion style: minimal, no background */}
      <div className="flex items-center justify-between px-1 py-2 mb-2 group">
        <div className="flex items-center gap-2 min-w-0">
          {/* Color dot */}
          <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />

          {/* Title */}
          <span className="text-sm font-medium text-foreground/80 truncate">
            {title}
          </span>

          {/* Count */}
          <span className="text-xs text-muted-foreground tabular-nums">
            {count}
          </span>

          {/* Aggregations */}
          {aggregations.length > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              {aggregations.map((agg, idx) => (
                <span
                  key={idx}
                  className="text-xs text-muted-foreground tabular-nums"
                  title={`${agg.label || agg.type}: ${formatAggregationValue(agg.type, agg.value)}`}
                >
                  {agg.label && <span className="mr-1 opacity-70">{agg.label}:</span>}
                  {formatAggregationValue(agg.type, agg.value)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions - show on hover */}
        <div className={cn(
          "flex items-center gap-0.5 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onAddCard}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Đổi tên cột</DropdownMenuItem>
              <DropdownMenuItem>Ẩn cột</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Column Content - minimal container, only subtle border on drag */}
      <div
        className={cn(
          "flex-1 min-h-[100px] rounded-lg transition-all duration-200",
          isDropTarget && "bg-muted/50 ring-2 ring-primary/20 ring-inset"
        )}
      >
        {children}
      </div>
    </div>
  );
}
