import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="container flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          K-<span className="text-primary">ERP</span>
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Hệ thống quản lý doanh nghiệp toàn diện. Quản lý tài nguyên, nhân sự,
          kho hàng và nhiều hơn nữa.
        </p>

        <div className="flex gap-4">
          {user ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Vào Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
