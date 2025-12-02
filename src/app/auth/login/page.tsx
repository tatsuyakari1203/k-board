import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            K-ERP
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="flex min-h-screen items-center justify-center px-6">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
