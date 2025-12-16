"use client";

import { motion } from "framer-motion";
import {
  LayoutGrid,
  Users,
  CheckSquare,
  Layers,
  Lock,
  Zap,
  ArrowRight,
  Github,
  Globe,
  Database,
  Cpu,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { DashboardPreview } from "./dashboard-preview";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export function HeroSection() {
  const t = useTranslations("Landing");

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full"
            >
              ✨ {t("badge")}
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t("heroTitle")}{" "}
            <span className="text-primary block mt-2">{t("heroTitleHighlight")}</span>
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t("heroDescription")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="h-12 px-8 text-base rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              asChild
            >
              <Link href="/auth/register">
                {t("getStarted")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
              asChild
            >
              <Link href="https://github.com/tatsuyakari1203/k-board" target="_blank">
                <Github className="mr-2 h-4 w-4" /> {t("starOnGithub")}
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.2 }}
          className="relative mx-auto max-w-5xl"
        >
          <div className="rounded-xl border bg-background/50 backdrop-blur-sm shadow-2xl overflow-hidden ring-1 ring-white/10">
            <DashboardPreview />
          </div>
          {/* Decorative glow behind the dashboard */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl blur-2xl -z-10 opacity-50" />
        </motion.div>
      </div>
    </section>
  );
}

export function BentoGridFeatures() {
  const t = useTranslations("Landing");

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              {t("featuresTitle")}
            </h2>
            <p className="text-muted-foreground text-lg">{t("featuresSubtitle")}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Large Item - Kanban & Boards */}
          <motion.div
            className="md:col-span-2 row-span-2 rounded-3xl border bg-background p-8 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative z-20 mb-auto">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{t("feature1Title")}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                {t("feature1Desc")}
              </p>
            </div>

            {/* Visual Representation: Kanban Board */}
            <div className="absolute right-0 bottom-0 w-full h-1/2 md:w-2/3 md:h-full md:top-12 md:right-0 pointer-events-none z-0">
              <div className="relative w-full h-full perspective-1000">
                {/* Column 1 */}
                <motion.div
                  className="absolute top-8 right-[45%] w-40 bg-muted/50 rounded-xl p-3 border border-border/50 backdrop-blur-sm"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="h-2 w-12 bg-primary/20 rounded-full mb-3" />
                  <div className="space-y-2">
                    <div className="h-16 bg-background rounded-lg border shadow-sm p-2">
                      <div className="h-2 w-20 bg-muted-foreground/20 rounded-full mb-2" />
                      <div className="h-2 w-12 bg-muted-foreground/10 rounded-full" />
                    </div>
                    <div className="h-16 bg-background rounded-lg border shadow-sm p-2 opacity-60">
                      <div className="h-2 w-16 bg-muted-foreground/20 rounded-full mb-2" />
                    </div>
                  </div>
                </motion.div>

                {/* Column 2 */}
                <motion.div
                  className="absolute top-20 right-[10%] w-40 bg-muted/50 rounded-xl p-3 border border-border/50 backdrop-blur-sm z-10"
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="h-2 w-12 bg-orange-500/20 rounded-full mb-3" />
                  <div className="space-y-2">
                    {/* Floating Card Animation */}
                    <motion.div
                      className="h-16 bg-background rounded-lg border shadow-md p-2 border-l-4 border-l-orange-500"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="h-2 w-24 bg-foreground/10 rounded-full mb-2" />
                      <div className="flex gap-1">
                        <div className="h-4 w-4 rounded-full bg-blue-500/20" />
                        <div className="h-4 w-4 rounded-full bg-green-500/20" />
                      </div>
                    </motion.div>
                    <div className="h-16 bg-background rounded-lg border shadow-sm p-2">
                      <div className="h-2 w-16 bg-muted-foreground/20 rounded-full mb-2" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl -z-0" />
          </motion.div>
          {/* Small Item 1 - Collaboration */}
          <motion.div
            className="rounded-3xl border bg-background p-6 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative z-20">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("feature2Title")}</h3>
              <p className="text-muted-foreground text-sm mb-8">{t("feature2Desc")}</p>
            </div>

            {/* Avatars Visual */}
            <div className="flex items-center -space-x-3 absolute bottom-6 right-6 z-10">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className={`h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm
                    ${i === 1 ? "bg-blue-500" : i === 2 ? "bg-purple-500" : "bg-green-500"}`}
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  {i === 1 ? "JD" : i === 2 ? "AS" : "MK"}
                </motion.div>
              ))}
              <motion.div
                className="h-6 w-12 bg-muted rounded-full ml-2 flex items-center justify-center gap-1"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span className="block h-1 w-1 bg-foreground/30 rounded-full animate-bounce" />
                <span className="block h-1 w-1 bg-foreground/30 rounded-full animate-bounce delay-75" />
                <span className="block h-1 w-1 bg-foreground/30 rounded-full animate-bounce delay-150" />
              </motion.div>
            </div>
          </motion.div>{" "}
          {/* Small Item 2 - Performance */}
          <motion.div
            className="rounded-3xl border bg-background p-6 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative z-20">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 text-green-500 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("feature3Title")}</h3>
              <p className="text-muted-foreground text-sm mb-6">{t("feature3Desc")}</p>
            </div>

            {/* Performance Graph Visual */}
            <div className="absolute bottom-0 left-0 w-full h-16 px-6 flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity z-0">
              {[40, 70, 50, 90, 60, 80, 100].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-green-500/20 rounded-t-sm"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                />
              ))}
            </div>
          </motion.div>{" "}
          {/* Medium Item - Security */}
          <motion.div
            className="md:col-span-3 lg:col-span-1 rounded-3xl border bg-background p-6 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative z-10">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500 group-hover:scale-110 transition-transform">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("feature4Title")}</h3>
              <p className="text-muted-foreground text-sm mb-4">{t("feature4Desc")}</p>

              {/* Security Visual */}
              <div className="mt-4 space-y-2">
                {["Admin", "Member", "Guest"].map((role, i) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-transparent group-hover:border-purple-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${i === 0 ? "bg-purple-500" : "bg-muted-foreground"}`}
                      />
                      <span className="text-xs font-medium">{role}</span>
                    </div>
                    <div className="h-4 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          {/* Wide Item - Multiple Views */}
          <motion.div
            className="md:col-span-3 lg:col-span-2 rounded-3xl border bg-background p-8 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex-1 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform duration-500">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{t("feature5Title")}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">{t("feature5Desc")}</p>
            </div>

            {/* View Switcher Visual */}
            <div className="w-full md:w-1/2 aspect-[16/9] bg-muted/30 rounded-xl border flex flex-col relative overflow-hidden group-hover:border-orange-500/20 transition-colors">
              {/* Header */}
              <div className="h-10 border-b bg-background/50 px-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-400/50" />
                  <div className="h-2 w-2 rounded-full bg-yellow-400/50" />
                  <div className="h-2 w-2 rounded-full bg-green-400/50" />
                </div>
                <div className="ml-auto flex gap-1 bg-muted rounded p-0.5">
                  <div className="h-4 w-4 rounded bg-background shadow-sm" />
                  <div className="h-4 w-4 rounded" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-3 relative">
                {/* Board View (Background) */}
                <div className="absolute inset-3 flex gap-3 opacity-30">
                  <div className="w-1/3 bg-muted/50 rounded-lg h-full" />
                  <div className="w-1/3 bg-muted/50 rounded-lg h-full" />
                  <div className="w-1/3 bg-muted/50 rounded-lg h-full" />
                </div>

                {/* Table View (Foreground Animation) */}
                <motion.div
                  className="absolute inset-3 bg-background rounded-lg border shadow-lg overflow-hidden flex flex-col"
                  initial={{ clipPath: "inset(0 0 0 0)" }}
                  whileInView={{
                    clipPath: ["inset(0 0 0 0)", "inset(0 100% 0 0)", "inset(0 0 0 0)"],
                  }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                >
                  <div className="h-8 border-b flex items-center px-3 gap-4 bg-muted/20">
                    <div className="h-2 w-20 bg-muted-foreground/20 rounded-full" />
                    <div className="h-2 w-12 bg-muted-foreground/10 rounded-full" />
                    <div className="h-2 w-16 bg-muted-foreground/10 rounded-full" />
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 border-b flex items-center px-3 gap-4">
                      <div className="h-2 w-24 bg-muted-foreground/10 rounded-full" />
                      <div className="h-2 w-10 bg-blue-500/10 rounded-full" />
                      <div className="h-4 w-4 rounded-full bg-muted" />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import {
  SiNextdotjs,
  SiReact,
  SiTailwindcss,
  SiMongodb,
  SiTypescript,
  SiGithub,
} from "react-icons/si";

export function TechStackSection() {
  const t = useTranslations("Landing");

  const stack = [
    { name: "Next.js 16", icon: SiNextdotjs },
    { name: "React 19", icon: SiReact },
    { name: "Tailwind CSS 4", icon: SiTailwindcss },
    { name: "MongoDB", icon: SiMongodb },
    { name: "TypeScript", icon: SiTypescript },
    { name: "GitHub", icon: SiGithub },
  ];

  return (
    <section className="py-20 border-y bg-background">
      <div className="container px-4 mx-auto text-center">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
          {t("techStackTitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {stack.map((tech, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <tech.icon className="h-6 w-6 group-hover:text-primary transition-colors" />
              <span className="font-medium group-hover:text-foreground transition-colors">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  const t = useTranslations("Landing");
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container px-4 mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{t("ctaTitle")}</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20"
              asChild
            >
              <Link href="/auth/register">
                {t("ctaButton")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{t("ctaNote")}</p>
        </motion.div>
      </div>
    </section>
  );
}
