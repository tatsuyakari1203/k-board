"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLES } from "@/types/user";

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

  const isAdmin = user.role === USER_ROLES.ADMIN;

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
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>Cài đặt</span>
          </Link>
        )}
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
