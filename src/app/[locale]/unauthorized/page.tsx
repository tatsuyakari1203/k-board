import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            K-Board
          </Link>
        </div>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="ghost" asChild className="font-normal text-muted-foreground">
              <Link href="/">Về trang chủ</Link>
            </Button>
            <Button asChild className="font-normal">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
