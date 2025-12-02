import { getCurrentUser } from "@/lib/auth-utils";
import { UserButton } from "@/components/auth";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Package,
  FileText,
  Settings,
  Search,
  ClipboardList
} from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center px-4">
            <Link href="/dashboard" className="text-base font-semibold tracking-tight">
              K-ERP
            </Link>
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent">
              <Search className="h-4 w-4" />
              <span>Tìm kiếm...</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-2">
            <NavItem href="/dashboard" icon={LayoutGrid} label="Tổng quan" />
            <NavItem href="/dashboard/boards" icon={ClipboardList} label="Quản lý công việc" />
            <NavItem href="/dashboard/users" icon={Users} label="Nhân sự" />
            <NavItem href="/dashboard/products" icon={Package} label="Sản phẩm" />
            <NavItem href="/dashboard/reports" icon={FileText} label="Báo cáo" />
            <NavItem href="/dashboard/settings" icon={Settings} label="Cài đặt" />
          </nav>

          {/* User */}
          <div className="border-t p-3">
            <UserButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-60">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
