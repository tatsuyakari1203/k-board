"use client";

import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function UserButton() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-1">
      {/* User info */}
      <div className="flex items-center gap-2 rounded-sm px-2 py-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-[10px] font-medium text-primary-foreground">
          {initials}
        </div>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-0.5">
        <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Settings className="h-4 w-4" />
          <span>Cài đặt</span>
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
