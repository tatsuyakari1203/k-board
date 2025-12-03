import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  ArrowRight,
  LayoutGrid,
  Users,
  CheckSquare,
  Layers,
  Lock,
  Zap,
} from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <span className="text-base font-medium">K-ERP</span>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">
                  Vào Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Bắt đầu ngay</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-screen-xl px-6 pt-28 pb-16">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-[1.15] text-foreground">
            Tổ chức công việc
            <br />
            một cách thông minh
          </h1>

          <p className="mt-4 text-muted-foreground leading-relaxed">
            Quản lý dự án, theo dõi tiến độ và cộng tác với đội nhóm
            trên một nền tảng duy nhất.
          </p>

          <div className="mt-8 flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">
                  Tiếp tục làm việc
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/auth/register">
                    Dùng thử miễn phí
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24">
          <h2 className="text-lg font-medium text-foreground mb-8">
            Tính năng
          </h2>

          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureItem
              icon={<LayoutGrid className="h-4 w-4" />}
              title="Bảng dự án"
              description="Tạo và quản lý nhiều bảng với các trường thông tin linh hoạt."
            />
            <FeatureItem
              icon={<Layers className="h-4 w-4" />}
              title="Đa dạng chế độ xem"
              description="Chuyển đổi giữa dạng bảng và Kanban dễ dàng."
            />
            <FeatureItem
              icon={<Users className="h-4 w-4" />}
              title="Cộng tác nhóm"
              description="Mời thành viên và làm việc cùng nhau hiệu quả."
            />
            <FeatureItem
              icon={<Lock className="h-4 w-4" />}
              title="Phân quyền"
              description="Thiết lập quyền xem, chỉnh sửa cho từng thành viên."
            />
            <FeatureItem
              icon={<CheckSquare className="h-4 w-4" />}
              title="Quản lý công việc"
              description="Theo dõi nhiệm vụ được giao, cập nhật trạng thái."
            />
            <FeatureItem
              icon={<Zap className="h-4 w-4" />}
              title="Nhanh chóng"
              description="Giao diện đơn giản, dễ sử dụng ngay lập tức."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 py-12 px-8 rounded-lg bg-muted/50">
          <h2 className="text-lg font-medium text-foreground">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo tài khoản miễn phí và khám phá ngay.
          </p>
          <div className="mt-6">
            {!user && (
              <Button asChild>
                <Link href="/auth/register">
                  Tạo tài khoản
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
            {user && (
              <Button asChild>
                <Link href="/dashboard">
                  Vào Dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8">
        <div className="mx-auto max-w-screen-xl px-6 py-6 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">© 2024 K-ERP</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
