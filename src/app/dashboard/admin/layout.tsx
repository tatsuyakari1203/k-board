import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { USER_ROLES } from "@/types/user";
import Link from "next/link";
import { Users, Settings, Shield, ChevronLeft } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== USER_ROLES.ADMIN) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6 gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Quản trị hệ thống</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r bg-muted/30 min-h-[calc(100vh-3.5rem)]">
          <nav className="p-4 space-y-1">
            <NavItem href="/dashboard/admin" icon={Shield} label="Tổng quan" />
            <NavItem href="/dashboard/admin/users" icon={Users} label="Quản lý người dùng" />
            <NavItem href="/dashboard/admin/settings" icon={Settings} label="Cài đặt hệ thống" />
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
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
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
