import { getCurrentUser } from "@/lib/auth-utils";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Xin chào, {user.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đây là tổng quan hoạt động kinh doanh của bạn.
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-normal text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Tạo mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng doanh thu" value="--" />
        <StatCard label="Đơn hàng" value="--" />
        <StatCard label="Khách hàng" value="--" />
        <StatCard label="Sản phẩm" value="--" />
      </div>

      {/* Quick start */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Bắt đầu nhanh</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
