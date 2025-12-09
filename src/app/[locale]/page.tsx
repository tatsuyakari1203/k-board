import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layout, Users, Zap } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";

export default function LandingPage() {
  const tAuth = useTranslations("Auth");
  const tLanding = useTranslations("Landing");

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
          <div className="relative aspect-video rounded-xl bg-muted border border-border/50 shadow-2xl overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background/10 z-0" />
            <div className="z-10 text-muted-foreground font-medium">Dashboard Preview</div>
          </div>
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
