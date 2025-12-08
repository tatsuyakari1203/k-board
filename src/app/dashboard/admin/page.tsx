"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import Link from "next/link";

interface UserCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const { data: counts = { total: 0, pending: 0, approved: 0, rejected: 0 }, isLoading: loading } =
    useQuery({
      queryKey: ["admin-stats"],
      queryFn: async () => {
        const res = await fetch("/api/admin/users?limit=1");
        if (!res.ok) throw new Error("Failed to fetch counts");
        const data = await res.json();
        return data.counts as UserCounts;
      },
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan quản trị</h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý người dùng và cài đặt hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng người dùng"
          value={counts.total}
          icon={Users}
          loading={loading}
          href="/dashboard/admin/users"
        />
        <StatCard
          title="Chờ duyệt"
          value={counts.pending}
          icon={Clock}
          loading={loading}
          href="/dashboard/admin/users?status=pending"
          highlight={counts.pending > 0}
        />
        <StatCard
          title="Đã duyệt"
          value={counts.approved}
          icon={UserCheck}
          loading={loading}
          href="/dashboard/admin/users?status=approved"
        />
        <StatCard
          title="Đã từ chối"
          value={counts.rejected}
          icon={UserX}
          loading={loading}
          href="/dashboard/admin/users?status=rejected"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            title="Quản lý người dùng"
            description="Xem, thêm, sửa, xóa người dùng"
            href="/dashboard/admin/users"
          />
          <QuickAction
            title="Cài đặt hệ thống"
            description="Cấu hình chế độ đăng ký"
            href="/dashboard/admin/settings"
          />
          {counts.pending > 0 && (
            <QuickAction
              title={`Duyệt ${counts.pending} người dùng`}
              description="Có người dùng đang chờ phê duyệt"
              href="/dashboard/admin/users?status=pending"
              highlight
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  href,
  highlight,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block p-4 rounded-lg border transition-colors hover:bg-accent/50 ${
        highlight ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : "bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-md ${highlight ? "bg-orange-100 dark:bg-orange-900/40" : "bg-muted"}`}
        >
          <Icon className={`h-5 w-5 ${highlight ? "text-orange-600" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-semibold ${highlight ? "text-orange-600" : ""}`}>
            {loading ? "..." : value}
          </p>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({
  title,
  description,
  href,
  highlight,
}: {
  title: string;
  description: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block p-4 rounded-lg border transition-colors hover:bg-accent/50 ${
        highlight ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : ""
      }`}
    >
      <p className={`font-medium ${highlight ? "text-orange-600" : ""}`}>{title}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
    </Link>
  );
}
