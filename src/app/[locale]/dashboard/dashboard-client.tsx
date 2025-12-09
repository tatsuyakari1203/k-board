"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  AlertCircle,
  Clock,
  CalendarDays,
  Mail,
  Loader2,
  ArrowRight,
  Plus,
  ExternalLink,
  BarChart3,
  Folders,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t("hello")}, {userName?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">{t("overview")}</p>
        </div>
        <Link href="/dashboard/boards">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createBoard")}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Folders}
          label={t("tasks")} // Note: "tasks" key is mapped to "Boards" in JSON, confusing naming but consistent with layout
          value={stats.totalBoards}
          href="/dashboard/boards"
          color="bg-blue-500"
        />
        <StatCard
          icon={CheckSquare}
          label={t("todo")}
          value={stats.totalTasks}
          href="/dashboard/todo"
          color="bg-green-500"
        />
        <StatCard
          icon={AlertCircle}
          label={t("overdue")}
          value={stats.overdueTasks}
          href="/dashboard/todo?filter=overdue"
          color="bg-red-500"
          highlight={stats.overdueTasks > 0}
        />
        <StatCard
          icon={Clock}
          label={t("today")}
          value={stats.todayTasks}
          href="/dashboard/todo?filter=today"
          color="bg-orange-500"
          highlight={stats.todayTasks > 0}
        />
      </div>

      {/* Pending Invitations Alert */}
      {stats.pendingInvitations > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="p-2 rounded-full bg-primary/20">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {t("hello")} {stats.pendingInvitations} {t("pendingInvites")}
            </p>
            <p className="text-sm text-muted-foreground">{t("pendingInvitesDesc")}</p>
          </div>
          <Link href="/dashboard/boards">
            <Button variant="outline" size="sm" className="gap-1">
              {t("view")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">{t("recentTasks")}</h2>
            </div>
            <Link
              href="/dashboard/todo"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {t("viewAll")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {data?.recentTasks && data.recentTasks.length > 0 ? (
              data.recentTasks.map((task) => (
                <Link
                  key={task._id}
                  href={`/dashboard/boards/${task.boardId}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{task.title || t("untitled")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.boardName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(new Date(task.updatedAt), {
                      addSuffix: true,
                      locale: locale === "vi" ? vi : enUS,
                    })}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noTasks")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Boards */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">{t("recentBoards")}</h2>
            </div>
            <Link
              href="/dashboard/boards"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {t("viewAll")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {data?.recentBoards && data.recentBoards.length > 0 ? (
              data.recentBoards.map((board) => (
                <Link
                  key={board._id}
                  href={`/dashboard/boards/${board._id}`}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                    {board.icon || "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{board.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {board.isOwner ? "Chủ sở hữu" : t("members")}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Folders className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noBoards")}</p>
                <Link href="/dashboard/boards">
                  <Button variant="outline" size="sm" className="mt-3">
                    {t("createFirstBoard")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Summary Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <SummaryCard
          icon={AlertCircle}
          label={t("overdue")}
          value={stats.overdueTasks}
          description={t("urgent")}
          color="text-red-500"
          bgColor="bg-red-50 dark:bg-red-500/10"
          href="/dashboard/todo"
        />
        <SummaryCard
          icon={Clock}
          label={t("dueToday")}
          value={stats.todayTasks}
          description={format(new Date(), "EEEE, dd/MM")} // Locale handling needed ideally
          color="text-orange-500"
          bgColor="bg-orange-50 dark:bg-orange-500/10"
          href="/dashboard/todo"
        />
        <SummaryCard
          icon={CalendarDays}
          label={t("thisWeek")}
          value={stats.weekTasks}
          description={t("tasksToComplete")}
          color="text-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-500/10"
          href="/dashboard/todo"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{t("quickActions")}</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/dashboard/boards"
            icon={Folders}
            title={t("manageBoards")}
            description={t("manageBoardsDesc")}
          />
          <QuickAction
            href="/dashboard/todo"
            icon={CheckSquare}
            title={t("todo")}
            description={t("myTasksDesc")}
          />
          <QuickAction
            href="/dashboard/users"
            icon={BarChart3}
            title={t("manageUsers")}
            description={t("manageUsersDesc")}
          />
          <QuickAction
            href="/dashboard/admin"
            icon={LayoutDashboard}
            title={t("admin")}
            description={t("adminDesc")}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB COMPONENTS
// ============================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  href: string;
  color: string;
  highlight?: boolean;
}

function StatCard({ icon: Icon, label, value, href, color, highlight }: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all group overflow-hidden",
        highlight && "ring-2 ring-red-500/50"
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-10",
          color
        )}
      />
      <div className="relative">
        <div className={cn("inline-flex p-2 rounded-lg mb-3", color, "bg-opacity-20")}>
          <Icon className={cn("h-5 w-5", color.replace("bg-", "text-"))} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
  color: string;
  bgColor: string;
  href: string;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  color,
  bgColor,
  href,
}: SummaryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50",
        bgColor
      )}
    >
      <div className={cn("p-3 rounded-full", bgColor)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      <div>
        <p className={cn("text-2xl font-bold", value > 0 ? color : "")}>{value}</p>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

function QuickAction({ href, icon: Icon, title, description }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
    >
      <div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </Link>
  );
}
