import { getCurrentUser } from "@/lib/auth-utils";
import { UserButton } from "@/components/auth";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  Users,
  CheckSquare,
  FileText,
  Settings,
  Search,
  ClipboardList,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "@/types/user";
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isAdmin = user.role === USER_ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-background">
      <DashboardShortcuts />
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-5">
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
              K-ERP
            </Link>
          </div>

          {/* Search */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Tìm kiếm... (Cmd+K)"
                className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-3">
            <NavItem href="/dashboard" icon={LayoutGrid} label="Tổng quan" />
            <NavItem href="/dashboard/todo" icon={CheckSquare} label="Việc của tôi" />
            <NavItem href="/dashboard/boards" icon={ClipboardList} label="Quản lý công việc" />
            <NavItem href="/dashboard/users" icon={Users} label="Nhân sự" />
            <NavItem href="/dashboard/reports" icon={FileText} label="Báo cáo" />
            <NavItem href="/dashboard/settings" icon={Settings} label="Cài đặt" />

            {/* Admin section - only visible to admins */}
            {isAdmin && (
              <>
                <div className="my-3 border-t" />
                <NavItem
                  href="/dashboard/admin"
                  icon={Shield}
                  label="Quản trị hệ thống"
                  highlight
                />
              </>
            )}
          </nav>

          {/* User */}
          <div className="border-t p-4">
            <UserButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  highlight,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-base transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
        highlight ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
