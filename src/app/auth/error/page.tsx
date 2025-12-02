import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            K-ERP
          </Link>
        </div>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Lỗi xác thực
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Đã có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại.
          </p>
          <Button asChild className="mt-6 h-10 font-normal">
            <Link href="/auth/login">Quay lại đăng nhập</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
