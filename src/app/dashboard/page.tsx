import { getCurrentUser } from "@/lib/auth-utils";
import { UserButton } from "@/components/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">K-ERP Dashboard</h1>
          <UserButton />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            Xin chào, {user.name}! 👋
          </h2>
          <p className="text-muted-foreground">
            Role: <span className="font-medium capitalize">{user.role}</span>
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Tổng doanh thu" value="--" />
          <DashboardCard title="Đơn hàng" value="--" />
          <DashboardCard title="Khách hàng" value="--" />
          <DashboardCard title="Sản phẩm" value="--" />
        </div>

        <div className="mt-8 rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-semibold">Bắt đầu phát triển</h3>
          <p className="text-muted-foreground">
            Hệ thống authentication đã sẵn sàng. Bạn có thể bắt đầu xây dựng các
            module ERP như:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground">
            <li>Quản lý người dùng (User Management)</li>
            <li>Quản lý sản phẩm (Product Management)</li>
            <li>Quản lý đơn hàng (Order Management)</li>
            <li>Quản lý kho (Inventory Management)</li>
            <li>Báo cáo và thống kê (Reports)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
