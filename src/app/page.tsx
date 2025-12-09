import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import { ArrowRight } from "lucide-react";
import {
  HeroText,
  HeroDescription,
  HeroButtons,
  FeaturesSection,
  CTASection,
} from "./landing-client";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          <span className="text-lg font-semibold">K-Board</span>
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
          <HeroText />
          <HeroDescription />
          <HeroButtons>
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
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
              </>
            )}
          </HeroButtons>
        </div>

        {/* Features */}
        <FeaturesSection />

        {/* CTA */}
        <CTASection>
          {!user && (
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Tạo tài khoản
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
        </CTASection>
      </main>

      {/* Footer */}
      <footer className="mt-12">
        <div className="mx-auto max-w-screen-xl px-6 py-8 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2024 K-Board</p>
        </div>
      </footer>
    </div>
  );
}
