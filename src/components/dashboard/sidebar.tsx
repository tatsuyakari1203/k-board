"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Users,
  CheckSquare,
  Settings,
  Search,
  ClipboardList,
  Menu,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5 border-b md:border-none">
        <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
          K-Board
        </Link>
        <LanguageSwitcher />
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={tCommon("search")}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-3">
        <NavItem
          href="/dashboard"
          icon={LayoutGrid}
          label={t("home")}
          active={pathname === "/dashboard"}
        />
        <NavItem
          href="/dashboard/todo"
          icon={CheckSquare}
          label={t("todo")}
          active={pathname.startsWith("/dashboard/todo")}
        />
        <NavItem
          href="/dashboard/boards"
          icon={ClipboardList}
          label={t("tasks")}
          active={pathname.startsWith("/dashboard/boards")}
        />
        <NavItem
          href="/dashboard/users"
          icon={Users}
          label={t("members")}
          active={pathname.startsWith("/dashboard/users")}
        />

        {/* Admin section - only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-3 border-t" />
            <NavItem
              href="/dashboard/admin"
              icon={Settings}
              label={t("settings")}
              highlight
              active={pathname.startsWith("/dashboard/admin")}
            />
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t p-4">
        <UserButton />
      </div>
    </div>
  );
}

export function MobileSidebar({ isAdmin }: SidebarProps) {
  const [open, setOpen] = useState(false);

  // Close sidebar when path changes (optional but usually good)
  // But Sheet handles this if we put it in layout?
  // Let's rely on standard behavior for now.

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <Sidebar isAdmin={isAdmin} />
      </SheetContent>
    </Sheet>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  highlight,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-base transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
        highlight ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"
      } ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
