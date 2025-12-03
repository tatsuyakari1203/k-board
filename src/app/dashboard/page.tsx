import { getCurrentUser } from "@/lib/auth-utils";
import { Plus } from "lucide-react";
import { PendingInvitations } from "@/components/board/PendingInvitations";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Xin chào, {user.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Đây là tổng quan hoạt động kinh doanh của bạn.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-5 w-5" />
          Tạo mới
        </button>
      </div>

      {/* Pending Invitations */}
      <PendingInvitations />

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng doanh thu" value="--" />
        <StatCard label="Đơn hàng" value="--" />
        <StatCard label="Khách hàng" value="--" />
        <StatCard label="Sản phẩm" value="--" />
      </div>

      {/* Quick start */}
      <div>
        <h3 className="text-base font-medium text-muted-foreground mb-5">Bắt đầu nhanh</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="rounded-lg border p-5">
      <p className="text-base text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function QuickAction({ title, description }: { title: string; description: string }) {
  return (
    <button className="group flex flex-col items-start rounded-lg border p-5 text-left transition-colors hover:bg-accent">
      <span className="text-base font-medium group-hover:text-foreground">{title}</span>
      <span className="mt-1.5 text-base text-muted-foreground">{description}</span>
    </button>
  );
}
