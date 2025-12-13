import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layout, Users, Zap } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getTranslations } from "next-intl/server";
import { UserService } from "@/services/user.service";
import { redirect } from "next/navigation";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

export default async function LandingPage() {
  // Check if system needs setup (0 users)
  // ... (keep existing check logic)
  try {
    const counts = await UserService.getUserCounts();
    if (counts.total === 0) {
      redirect("/auth/register?setup=true");
    }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("Failed to check system status:", error);
  }

  const tAuth = await getTranslations("Auth");
  const tLanding = await getTranslations("Landing");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          <span className="text-lg font-semibold">K-Board</span>
          <nav className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button asChild>
              <Link href="/auth/login">{tAuth("login")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/auth/register">{tAuth("register")}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center pt-24 pb-12 px-6">
        <div className="mx-auto max-w-screen-xl grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              {tLanding("heroTitle")} <br />
              <span className="text-primary">{tLanding("heroTitleHighlight")}</span>
            </h1>
            <p className="text-lg text-muted-foreground">{tLanding("heroDescription")}</p>
            <div className="flex items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  {tLanding("getStarted")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">{tLanding("login")}</Link>
              </Button>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-24 px-6">
        <div className="mx-auto max-w-screen-xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">{tLanding("featuresTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{tLanding("featuresSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Layout className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">{tLanding("feature1Title")}</h3>
              <p className="text-muted-foreground">{tLanding("feature1Desc")}</p>
            </div>
            <div className="bg-background p-6 rounded-lg border shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">{tLanding("feature2Title")}</h3>
              <p className="text-muted-foreground">{tLanding("feature2Desc")}</p>
            </div>
            <div className="bg-background p-6 rounded-lg border shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">{tLanding("feature3Title")}</h3>
              <p className="text-muted-foreground">{tLanding("feature3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12">
        <div className="mx-auto max-w-screen-xl px-6 py-8 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2024 K-Board</p>
        </div>
      </footer>
    </div>
  );
}
