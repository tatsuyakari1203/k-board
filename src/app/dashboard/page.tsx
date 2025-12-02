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
  Plus
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
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
            <span className="text-base font-semibold tracking-tight">K-ERP</span>
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
            <NavItem href="/dashboard" icon={LayoutGrid} label="Tổng quan" active />
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
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-6">
          <div>
            <h1 className="text-base font-medium">Tổng quan</h1>
          </div>
          <button className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-sm font-normal text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Tạo mới
          </button>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Xin chào, {user.name?.split(" ")[0]} 👋
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Đây là tổng quan hoạt động kinh doanh của bạn.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Tổng doanh thu" value="--" />
            <StatCard label="Đơn hàng" value="--" />
            <StatCard label="Khách hàng" value="--" />
            <StatCard label="Sản phẩm" value="--" />
          </div>

          {/* Quick start */}
          <div className="mt-12">
            <h3 className="text-sm font-medium text-muted-foreground">Bắt đầu nhanh</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <QuickAction
                title="Thêm nhân viên"
                description="Mời thành viên mới vào hệ thống"
              />
              <QuickAction
                title="Tạo sản phẩm"
                description="Thêm sản phẩm mới vào kho"
              />
              <QuickAction
                title="Xem báo cáo"
                description="Phân tích dữ liệu kinh doanh"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function QuickAction({ title, description }: { title: string; description: string }) {
  return (
    <button className="group flex flex-col items-start rounded-sm border p-4 text-left transition-colors hover:bg-accent">
      <span className="text-sm font-medium group-hover:text-foreground">{title}</span>
      <span className="mt-1 text-sm text-muted-foreground">{description}</span>
    </button>
  );
}
