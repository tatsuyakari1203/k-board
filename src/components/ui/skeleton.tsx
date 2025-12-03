import { cn } from "@/lib/utils";
import { type CSSProperties } from "react";

// ============================================
// BASE SKELETON
// ============================================

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      style={style}
    />
  );
}

// ============================================
// COMMON SKELETON PATTERNS
// ============================================

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return <Skeleton className={cn("rounded-full", sizes[size])} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-9 w-24 rounded-md", className)} />;
}

export function SkeletonInput({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-full rounded-md", className)} />;
}

// ============================================
// CARD SKELETON
// ============================================

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

// ============================================
// TABLE SKELETON
// ============================================

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
}: SkeletonTableProps) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex gap-4 p-3 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 flex-1"
              style={{ maxWidth: i === 0 ? "200px" : "120px" }}
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-5 flex-1"
              style={{ maxWidth: colIndex === 0 ? "200px" : "120px" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// LIST SKELETON
// ============================================

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-md border">
          <SkeletonAvatar size="sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// KANBAN SKELETON
// ============================================

export function SkeletonKanbanColumn() {
  return (
    <div className="flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-6 ml-auto" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card rounded-md p-3 space-y-2 border">
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonKanbanColumn key={i} />
      ))}
    </div>
  );
}

// ============================================
// BOARD CARD SKELETON
// ============================================

export function SkeletonBoardCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonBoardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBoardCard key={i} />
      ))}
    </div>
  );
}

// ============================================
// PAGE LOADING
// ============================================

export function PageLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonButton />
      </div>

      {/* Content */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}

// ============================================
// INLINE LOADING SPINNER
// ============================================

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <svg
      className={cn("animate-spin text-muted-foreground", sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
