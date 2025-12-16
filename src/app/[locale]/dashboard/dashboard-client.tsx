"use client";

import { useState, useEffect, useCallback, ElementType } from "react";
import { Link } from "@/i18n/routing";
import {
  LayoutDashboard,
  CheckSquare,
  Mail,
  Loader2,
  ArrowRight,
  Plus,
  ExternalLink,
  BarChart3,
  Folders,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalBoards: number;
  totalTasks: number;
  overdueTasks: number;
  todayTasks: number;
  weekTasks: number;
  pendingInvitations: number;
}

interface RecentTask {
  _id: string;
  title: string;
  boardId: string;
  boardName: string;
  updatedAt: string;
}

interface RecentBoard {
  _id: string;
  name: string;
  icon: string;
  isOwner: boolean;
}

interface DashboardData {
  stats: DashboardStats;
  recentTasks: RecentTask[];
  recentBoards: RecentBoard[];
}

interface DashboardClientProps {
  userName: string;
}

export default function DashboardClient({ userName }: DashboardClientProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalBoards: 0,
    totalTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    weekTasks: 0,
    pendingInvitations: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("hello")}, {userName?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("overview")}</p>
        </div>
        <Link href="/dashboard/boards">
          <Button className="rounded-full px-6 shadow-none">
            <Plus className="h-4 w-4 mr-2" />
            {t("createBoard")}
          </Button>
        </Link>
      </div>

      {/* Stats Overview - Minimal */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCardMinimal label={t("tasks")} value={stats.totalBoards} href="/dashboard/boards" />
        <StatCardMinimal label={t("todo")} value={stats.totalTasks} href="/dashboard/todo" />
        <StatCardMinimal
          label={t("overdue")}
          value={stats.overdueTasks}
          href="/dashboard/todo?filter=overdue"
          highlight={stats.overdueTasks > 0}
        />
        <StatCardMinimal
          label={t("today")}
          value={stats.todayTasks}
          href="/dashboard/todo?filter=today"
          subLabel={stats.todayTasks > 0 ? t("urgent") : undefined}
        />
      </div>

      {/* Pending Invitations Alert */}
      {stats.pendingInvitations > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400">
          <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-500/20">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {stats.pendingInvitations} {t("pendingInvites")}
            </p>
          </div>
          <Link href="/dashboard/boards">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-700 dark:text-orange-400"
            >
              {t("view")} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2 mt-4">
        {/* Recent Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">{t("recentTasks")}</h2>
            <Link
              href="/dashboard/todo"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {t("viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {data?.recentTasks && data.recentTasks.length > 0 ? (
              data.recentTasks.map((task) => (
                <Link
                  key={task._id}
                  href={`/dashboard/boards/${task.boardId}`}
                  className="group flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted transition-all"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {task.title || t("untitled")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block w-2 H-2 rounded-full bg-primary/20" />
                      <p className="text-xs text-muted-foreground">{task.boardName}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0 bg-background px-2 py-1 rounded-md shadow-sm">
                    {formatDistanceToNow(new Date(task.updatedAt), {
                      addSuffix: true,
                      locale: locale === "vi" ? vi : enUS,
                    })}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl bg-muted/10 border border-dashed border-muted">
                <p className="text-sm text-muted-foreground">{t("noTasks")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Boards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">{t("recentBoards")}</h2>
            <Link
              href="/dashboard/boards"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {t("viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {data?.recentBoards && data.recentBoards.length > 0 ? (
              data.recentBoards.map((board) => (
                <Link
                  key={board._id}
                  href={`/dashboard/boards/${board._id}`}
                  className="flex flex-col gap-3 p-5 rounded-xl bg-card border shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{board.icon || "📋"}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="font-semibold truncate group-hover:text-primary transition-colors">
                      {board.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {board.isOwner ? "Owner" : t("members")}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full p-8 text-center rounded-xl bg-muted/10 border border-dashed border-muted">
                <p className="text-sm text-muted-foreground mb-4">{t("noBoards")}</p>
                <Link href="/dashboard/boards">
                  <Button variant="outline" size="sm" className="rounded-full">
                    {t("createFirstBoard")}
                  </Button>
                </Link>
              </div>
            )}

            {/* Add New Board Card - Minimal */}
            <Link
              href="/dashboard/boards"
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed hover:bg-muted/30 transition-all text-muted-foreground hover:text-primary cursor-pointer h-full min-h-[120px]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">{t("createBoard")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions - Modern List */}
      <div className="pt-8 border-t border-dashed">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          {t("quickActions")}
        </h3>
        <div className="flex flex-wrap gap-4">
          <QuickActionMinimal href="/dashboard/boards" icon={Folders} title={t("manageBoards")} />
          <QuickActionMinimal href="/dashboard/todo" icon={CheckSquare} title={t("todo")} />
          <QuickActionMinimal href="/dashboard/users" icon={BarChart3} title={t("manageUsers")} />
          <QuickActionMinimal href="/dashboard/admin" icon={LayoutDashboard} title={t("admin")} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODERN MINIMAL SUB-COMPONENTS
// ============================================

function StatCardMinimal({
  label,
  value,
  href,
  highlight,
  subLabel,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
  subLabel?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all",
        highlight && "ring-2 ring-red-500/20 border-red-200 dark:border-red-900"
      )}
    >
      <span
        className={cn(
          "text-3xl font-extrabold tracking-tight",
          highlight ? "text-red-500" : "text-foreground"
        )}
      >
        {value}
      </span>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {subLabel && (
          <span className="text-xs font-semibold text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full">
            {subLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

function QuickActionMinimal({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: ElementType;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-muted/50 transition-colors text-sm font-medium shadow-sm"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {title}
    </Link>
  );
}
