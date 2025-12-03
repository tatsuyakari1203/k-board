import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  ArrowRight,
  LayoutGrid,
  Users,
  CheckSquare,
  Layers,
  Lock,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          <span className="text-xl font-semibold tracking-tight">K-ERP</span>
          <nav className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">
                  Vào Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Bắt đầu ngay</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-screen-xl px-6 pt-32 pb-20">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Nền tảng quản lý công việc
          </Badge>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-foreground">
            Tổ chức công việc
            <br />
            một cách thông minh
          </h1>

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Quản lý dự án, theo dõi tiến độ và cộng tác với đội nhóm
            trên một nền tảng duy nhất, đơn giản và hiệu quả.
          </p>

          <div className="mt-10 flex items-center gap-4">
            {user ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Tiếp tục làm việc
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/auth/register">
                    Dùng thử miễn phí
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-28">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground">
              Mọi thứ bạn cần
            </h2>
            <p className="mt-2 text-muted-foreground">
              Công cụ mạnh mẽ cho mọi quy mô dự án
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<LayoutGrid className="h-5 w-5" />}
              title="Bảng dự án"
              description="Tạo và quản lý nhiều bảng với các trường thông tin linh hoạt theo nhu cầu."
            />
            <FeatureCard
              icon={<Layers className="h-5 w-5" />}
              title="Đa dạng chế độ xem"
              description="Chuyển đổi giữa dạng bảng và Kanban để theo dõi công việc thuận tiện."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Cộng tác nhóm"
              description="Mời thành viên, phân công nhiệm vụ và làm việc cùng nhau hiệu quả."
            />
            <FeatureCard
              icon={<Lock className="h-5 w-5" />}
              title="Kiểm soát quyền truy cập"
              description="Thiết lập quyền xem, chỉnh sửa cho từng thành viên trong dự án."
            />
            <FeatureCard
              icon={<CheckSquare className="h-5 w-5" />}
              title="Quản lý công việc"
              description="Theo dõi các nhiệm vụ được giao, cập nhật trạng thái dễ dàng."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Giao diện trực quan"
              description="Thiết kế đơn giản, dễ sử dụng ngay từ lần đầu tiên."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-28 text-center">
          <Card className="border-dashed">
            <CardContent className="py-12">
              <h2 className="text-2xl font-semibold text-foreground">
                Bắt đầu ngay hôm nay
              </h2>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Tạo tài khoản miễn phí và khám phá cách quản lý công việc hiệu quả hơn.
              </p>
              <div className="mt-8">
                {!user && (
                  <Button size="lg" asChild>
                    <Link href="/auth/register">
                      Tạo tài khoản miễn phí
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {user && (
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      Vào Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="mx-auto max-w-screen-xl px-6 py-8 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 K-ERP
          </p>
          <p className="text-sm text-muted-foreground">
            Made with care
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="group hover:border-foreground/20 transition-colors">
      <CardContent className="pt-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-foreground mb-4">
          {icon}
        </div>
        <h3 className="font-medium text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
