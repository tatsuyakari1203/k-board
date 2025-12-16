import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getTranslations } from "next-intl/server";
import {
  HeroSection,
  BentoGridFeatures,
  TechStackSection,
  CTASection,
} from "@/components/landing/landing-sections";

export default async function LandingPage() {
  // Landing page should always be accessible
  // Authentication check is handled in /auth/* routes

  const tAuth = await getTranslations("Auth");
  const tLanding = await getTranslations("Landing");

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10 selection:text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
              K
            </div>
            <span className="text-lg font-bold tracking-tight">K-Board</span>
          </div>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/auth/login">{tAuth("login")}</Link>
              </Button>
              <Button asChild className="rounded-full shadow-md shadow-primary/20">
                <Link href="/auth/register">{tAuth("register")}</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />

        <TechStackSection />

        <BentoGridFeatures />

        <CTASection />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                K
              </div>
              <span className="font-bold">K-Board</span>
            </div>
            <p className="text-sm text-muted-foreground">{tLanding("footerCopyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
