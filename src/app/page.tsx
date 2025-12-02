import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <span className="text-base font-semibold tracking-tight">K-ERP</span>
          <nav className="flex items-center gap-1">
            {user ? (
              <Button variant="ghost" size="sm" asChild className="text-sm font-normal">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-sm font-normal text-muted-foreground">
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild className="text-sm font-normal">
                  <Link href="/auth/register">Bắt đầu miễn phí</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero - Notion style */}
      <main className="mx-auto max-w-screen-xl px-6 pt-32 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
            Quản lý doanh nghiệp
            <br />
            <span className="text-muted-foreground">đơn giản hơn.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            K-ERP giúp bạn quản lý tài nguyên, nhân sự, kho hàng và tài chính
            trong một nền tảng duy nhất. Không phức tạp, không rườm rà.
          </p>

          <div className="mt-10 flex items-center gap-4">
            {user ? (
              <Button asChild size="lg" className="h-11 px-6 text-base font-normal">
                <Link href="/dashboard">
                  Tiếp tục làm việc
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-11 px-6 text-base font-normal">
                  <Link href="/auth/register">
                    Dùng thử miễn phí
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild className="h-11 px-6 text-base font-normal text-muted-foreground">
                  <Link href="/auth/login">Đăng nhập →</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features - Clean list style */}
        <div className="mt-32 border-t pt-16">
          <div className="grid gap-12 md:grid-cols-3">
            <FeatureItem
              title="Quản lý nhân sự"
              description="Theo dõi nhân viên, phân quyền và quản lý hiệu suất làm việc."
            />
            <FeatureItem
              title="Quản lý kho"
              description="Kiểm soát tồn kho, xuất nhập và theo dõi sản phẩm realtime."
            />
            <FeatureItem
              title="Báo cáo thông minh"
              description="Dashboard trực quan, báo cáo tự động và phân tích dữ liệu."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-screen-xl px-6 py-8">
          <p className="text-sm text-muted-foreground">
            © 2024 K-ERP. Xây dựng bởi đội ngũ Việt Nam.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
