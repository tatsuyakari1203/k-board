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
    <div className="space-y-1.5">
      {/* User info */}
      <div className="flex items-center gap-3 rounded-md px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
          {initials}
        </div>
        <div className="flex-1 truncate">
          <p className="truncate text-base font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-0.5">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Settings className="h-5 w-5" />
          <span>Cài đặt</span>
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
