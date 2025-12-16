"use client";

import { Link } from "@/i18n/routing";
import { LogOut, Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLES } from "@/types/user";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { UserProfileDialog } from "./user-profile-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserButton() {
  const { user, isAuthenticated, logout } = useAuth();
  const t = useTranslations("Auth");
  const tDashboard = useTranslations("Dashboard");
  const [showProfileDialog, setShowProfileDialog] = useState(false);

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
        <Avatar className="h-8 w-8 rounded-md">
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="truncate text-base font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-0.5">
        <button
          onClick={() => setShowProfileDialog(true)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          <span>{t("profile")}</span>
        </button>

        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Shield className="h-5 w-5" />
            <span>{tDashboard("admin")}</span>
          </Link>
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span>{t("logout")}</span>
        </button>
      </div>

      <UserProfileDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </div>
  );
}
