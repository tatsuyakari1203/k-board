"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "@/i18n/routing";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  Calendar,
  LayoutGrid,
  List,
  Loader2,
  Search,
  ArrowUpDown,
  Filter,
  GripVertical,
  X,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  CalendarDays,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import { format, isToday, isPast, isThisWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PropertyType, type Property } from "@/types/board";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

// ============================================
// TYPES
// ============================================

interface TaskData {
  _id: string;
  boardId: string;
  title: string;
  properties: Record<string, unknown>;
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Helper for status handling, might be computed
  statusPropertyId?: string;
}

interface BoardData {
  _id: string;
  name: string;
  properties: Property[];
  isOwner?: boolean;
}

interface TodoPreferences {
  customOrder: string[];
  viewMode: "all" | "by-board";
  sortField: string | null;
  sortDirection: "asc" | "desc";
  filters: {
    boards: string[];
    statuses: string[];
    dueDateFilter: "all" | "overdue" | "today" | "week" | "no-date";
  };
  showAllTasks: boolean;
}

type SortField = "title" | "createdAt" | "updatedAt" | "dueDate" | null;

// ============================================
// MAIN COMPONENT
// ============================================

export default function TodoPage() {
  const t = useTranslations("Todo");
  const locale = useLocale();

  // Data state
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [canShowAllTasks, setCanShowAllTasks] = useState(false);

  // Preferences state
  const [viewMode, setViewMode] = useState<"all" | "by-board">("all");
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBoards, setFilterBoards] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<
    "all" | "overdue" | "today" | "week" | "no-date"
  >("all");

  // UI state
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set());
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/my-tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setBoards(data.boards || []);
        setCanShowAllTasks(data.canShowAllTasks || false);

        // Set preferences from server
        if (data.preferences) {
          setCustomOrder(data.preferences.customOrder || []);
          setViewMode(data.preferences.viewMode || "all");
          setSortField(data.preferences.sortField || null);
          setSortDirection(data.preferences.sortDirection || "desc");
          setShowAllTasks(data.preferences.showAllTasks || false);
          if (data.preferences.filters) {
            setFilterBoards(data.preferences.filters.boards || []);
            setFilterStatuses(data.preferences.filters.statuses || []);
            setDueDateFilter(data.preferences.filters.dueDateFilter || "all");
          }
        }

        // Expand all boards by default
        setExpandedBoards(new Set(data.boards?.map((b: BoardData) => b._id) || []));
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error(t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ============================================
  // SAVE PREFERENCES
  // ============================================

  const savePreferences = useCallback(async (updates: Partial<TodoPreferences>) => {
    try {
      await fetch("/api/tasks/my-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  }, []);

  // ============================================
  // TASK UPDATE
  // ============================================

  const updateTask = useCallback(
    async (taskId: string, boardId: string, updates: { properties?: Record<string, unknown> }) => {
      setUpdatingTask(taskId);
      try {
        const res = await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          const updatedTask = await res.json();
          setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, ...updatedTask } : t)));
          toast.success(t("updated"));
        } else {
          toast.error(t("failedToUpdate"));
        }
      } catch (error) {
        console.error("Failed to update task:", error);
        toast.error(t("failedToUpdate"));
      } finally {
        setUpdatingTask(null);
      }
    },
    [t]
  );

  // ============================================
  // HELPERS
  // ============================================

  const getBoard = useCallback(
    (boardId: string) => boards.find((b) => b._id === boardId),
    [boards]
  );

  const getBoardStatusProperty = useCallback((board?: BoardData) => {
    return board?.properties.find((p) => p.type === PropertyType.STATUS);
  }, []);

  const getBoardDateProperty = useCallback((board?: BoardData) => {
    return board?.properties.find((p) => p.type === PropertyType.DATE);
  }, []);

  const getTaskStatus = useCallback(
    (task: TaskData, board?: BoardData) => {
      const statusProp = getBoardStatusProperty(board);
      if (!statusProp) return null;
      const optionId = task.properties?.[statusProp.id];
      return statusProp.options?.find((o) => o.id === optionId) || null;
    },
    [getBoardStatusProperty]
  );

  const getTaskDueDate = useCallback(
    (task: TaskData, board?: BoardData) => {
      const dateProp = getBoardDateProperty(board);
      if (!dateProp) return null;
      const dateStr = task.properties?.[dateProp.id] as string;
      return dateStr ? new Date(dateStr) : null;
    },
    [getBoardDateProperty]
  );

  // ============================================
  // DERIVED STATE
  // ============================================

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const board = getBoard(task.boardId);
      if (!board) return false;

      // Filter by Board
      if (filterBoards.length > 0 && !filterBoards.includes(board._id)) {
        return false;
      }

      // Filter by Status
      if (filterStatuses.length > 0) {
        const status = getTaskStatus(task, board);
        if (!status || !filterStatuses.includes(status.id)) {
          return false;
        }
      }

      // Filter by Due Date
      if (dueDateFilter !== "all") {
        const dueDate = getTaskDueDate(task, board);
        if (dueDateFilter === "no-date") {
          if (dueDate) return false;
        } else {
          if (!dueDate) return false;
          if (dueDateFilter === "overdue" && !isPast(dueDate)) return false;
          if (dueDateFilter === "today" && !isToday(dueDate)) return false;
          if (dueDateFilter === "week" && !isThisWeek(dueDate)) return false;
        }
      }

      // Filter by Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (task.title.toLowerCase().includes(query)) return true;
        if (board.name.toLowerCase().includes(query)) return true;
        // Search properties could go here
        return false;
      }

      return true;
    });
  }, [
    tasks,
    getBoard,
    getTaskStatus,
    getTaskDueDate,
    filterBoards,
    filterStatuses,
    dueDateFilter,
    searchQuery,
  ]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];

    if (sortField) {
      list.sort((a, b) => {
        let valA: string | number = a.title;
        let valB: string | number = b.title;

        if (sortField === "title") {
          valA = a.title;
          valB = b.title;
        } else if (sortField === "createdAt") {
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
        } else if (sortField === "updatedAt") {
          valA = new Date(a.updatedAt).getTime();
          valB = new Date(b.updatedAt).getTime();
        } else if (sortField === "dueDate") {
          const boardA = getBoard(a.boardId);
          const boardB = getBoard(b.boardId);
          const dateA = getTaskDueDate(a, boardA);
          const dateB = getTaskDueDate(b, boardB);
          valA = dateA ? dateA.getTime() : 0;
          valB = dateB ? dateB.getTime() : 0;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else if (customOrder.length > 0) {
      // Sort by custom order
      const orderMap = new Map(customOrder.map((id, index) => [id, index]));
      list.sort((a, b) => {
        const indexA = orderMap.get(a._id) ?? Infinity;
        const indexB = orderMap.get(b._id) ?? Infinity;
        return indexA - indexB;
      });
    }

    return list;
  }, [filteredTasks, sortField, sortDirection, customOrder, getBoard, getTaskDueDate]);

  // Group by board
  const tasksByBoard = useMemo(() => {
    const grouped: Record<string, TaskData[]> = {};
    boards.forEach((b) => (grouped[b._id] = []));

    // Also include boards that might not cover all tasks? No, tasks reference existing boards.
    // But sortedTasks might have tasks from boards we know.

    sortedTasks.forEach((task) => {
      if (!grouped[task.boardId]) grouped[task.boardId] = [];
      grouped[task.boardId].push(task);
    });

    return grouped;
  }, [boards, sortedTasks]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    let completed = 0;
    let overdue = 0;
    let today = 0;
    let thisWeek = 0;
    const statusCounts: Record<string, { label: string; count: number; color?: string }> = {};
    const boardCounts: Record<string, number> = {};

    tasks.forEach((task) => {
      const board = getBoard(task.boardId);
      const status = getTaskStatus(task, board);
      const dueDate = getTaskDueDate(task, board);

      // Status aggregation
      if (status) {
        if (!statusCounts[status.id]) {
          statusCounts[status.id] = { label: status.label, count: 0, color: status.color };
        }
        statusCounts[status.id].count++;

        // Assume 'done' or 'complete' in label or some convention means completed?
        // Or if status type is 'completed'? Notion status usually has groups.
        // For now, naive check on label.
        const lowerLabel = status.label.toLowerCase();
        if (["done", "completed", "hoàn thành", "xong"].includes(lowerLabel)) {
          completed++;
        }
      }

      // Date aggregation
      if (dueDate) {
        if (isPast(dueDate) && !isToday(dueDate)) overdue++;
        if (isToday(dueDate)) today++;
        if (isThisWeek(dueDate)) thisWeek++;
      }

      // Board aggregation
      if (board) {
        boardCounts[board._id] = (boardCounts[board._id] || 0) + 1;
      }
    });

    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdue,
      today,
      thisWeek,
      statusCounts,
      boardCounts,
    };
  }, [tasks, getBoard, getTaskStatus, getTaskDueDate]);

  const activeFilterCount =
    filterBoards.length + filterStatuses.length + (dueDateFilter !== "all" ? 1 : 0);

  // ============================================
  // HANDLERS
  // ============================================

  const handleShowAllTasksChange = async (checked: boolean) => {
    setShowAllTasks(checked);
    await savePreferences({ showAllTasks: checked });
    fetchTasks();
  };

  const handleDueDateFilterChange = (filter: typeof dueDateFilter) => {
    setDueDateFilter(filter);
    savePreferences({
      filters: { boards: filterBoards, statuses: filterStatuses, dueDateFilter: filter },
    });
  };

  const handleSortChange = (field: SortField) => {
    let direction: "asc" | "desc" = "desc";
    if (sortField === field) {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortField(field);
    setSortDirection(direction);
    savePreferences({ sortField: field, sortDirection: direction });
  };

  const handleClearSort = () => {
    setSortField(null);
    savePreferences({ sortField: null });
  };

  const handleViewModeChange = (mode: "all" | "by-board") => {
    setViewMode(mode);
    savePreferences({ viewMode: mode });
  };

  const toggleBoard = (boardId: string) => {
    const newExpanded = new Set(expandedBoards);
    if (newExpanded.has(boardId)) {
      newExpanded.delete(boardId);
    } else {
      newExpanded.add(boardId);
    }
    setExpandedBoards(newExpanded);
  };

  // Drag and Drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      setCustomOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);

        let newOrder = [...prev];
        // If items not in custom order yet (e.g. new tasks), append/prepend logic needed
        // But assuming they are:
        if (oldIndex !== -1 && newIndex !== -1) {
          newOrder = arrayMove(prev, oldIndex, newIndex);
        } else {
          // Rebuild custom order from sortedTasks current mapping involves more complex logic
          // For checking purposes, let's just use what we have in sortedTasks id list if simpler
          const ids = sortedTasks.map((t) => t._id);
          const oldI = ids.indexOf(active.id as string);
          const newI = ids.indexOf(over.id as string);
          newOrder = arrayMove(ids, oldI, newI);
        }

        savePreferences({ customOrder: newOrder });
        return newOrder;
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        {/* Show all tasks toggle (for admin/owner) */}
        {canShowAllTasks && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-all"
              checked={showAllTasks}
              onCheckedChange={handleShowAllTasksChange}
            />
            <Label htmlFor="show-all" className="text-sm flex items-center gap-1">
              {showAllTasks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {t("showAll")}
            </Label>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {tasks.length > 0 && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Total Tasks */}
          <div className="relative overflow-hidden rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t("totalTasks")}</p>
              </div>
            </div>
            {stats.completionRate > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t("completed")}</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Overdue */}
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50",
              stats.overdue > 0
                ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                : "bg-card"
            )}
            onClick={() =>
              handleDueDateFilterChange(dueDateFilter === "overdue" ? "all" : "overdue")
            }
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  stats.overdue > 0 ? "bg-red-100 dark:bg-red-500/20" : "bg-muted"
                )}
              >
                <AlertCircle
                  className={cn(
                    "h-5 w-5",
                    stats.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    stats.overdue > 0 && "text-red-600 dark:text-red-400"
                  )}
                >
                  {stats.overdue}
                </p>
                <p className="text-xs text-muted-foreground">{t("overdue")}</p>
              </div>
            </div>
            {dueDateFilter === "overdue" && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-[10px]">
                  {t("filterActive")}
                </Badge>
              </div>
            )}
          </div>

          {/* Today */}
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50",
              stats.today > 0
                ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30"
                : "bg-card"
            )}
            onClick={() => handleDueDateFilterChange(dueDateFilter === "today" ? "all" : "today")}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  stats.today > 0 ? "bg-orange-100 dark:bg-orange-500/20" : "bg-muted"
                )}
              >
                <Clock
                  className={cn(
                    "h-5 w-5",
                    stats.today > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    stats.today > 0 && "text-orange-600 dark:text-orange-400"
                  )}
                >
                  {stats.today}
                </p>
                <p className="text-xs text-muted-foreground">{t("today")}</p>
              </div>
            </div>
            {dueDateFilter === "today" && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-[10px]">
                  {t("filterActive")}
                </Badge>
              </div>
            )}
          </div>

          {/* This Week */}
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border bg-card p-4 cursor-pointer transition-colors hover:bg-muted/50"
            )}
            onClick={() => handleDueDateFilterChange(dueDateFilter === "week" ? "all" : "week")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground">{t("thisWeek")}</p>
              </div>
            </div>
            {dueDateFilter === "week" && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-[10px]">
                  {t("filterActive")}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status & Board Summary */}
      {tasks.length > 0 && (Object.keys(stats.statusCounts).length > 0 || boards.length > 1) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Status Distribution */}
          {Object.keys(stats.statusCounts).length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                {t("statusDistribution")}
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.statusCounts).map(([id, data]) => (
                  <div key={id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full shrink-0",
                        data.color?.includes("green") && "bg-green-500",
                        data.color?.includes("yellow") && "bg-yellow-500",
                        data.color?.includes("red") && "bg-red-500",
                        data.color?.includes("blue") && "bg-blue-500",
                        data.color?.includes("purple") && "bg-purple-500",
                        data.color?.includes("gray") && "bg-gray-400",
                        !data.color && "bg-gray-400"
                      )}
                    />
                    <span className="text-sm flex-1 truncate">{data.label}</span>
                    <span className="text-sm font-medium">{data.count}</span>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          data.color?.includes("green") && "bg-green-500",
                          data.color?.includes("yellow") && "bg-yellow-500",
                          data.color?.includes("red") && "bg-red-500",
                          data.color?.includes("blue") && "bg-blue-500",
                          data.color?.includes("purple") && "bg-purple-500",
                          data.color?.includes("gray") && "bg-gray-400",
                          !data.color && "bg-gray-400"
                        )}
                        style={{ width: `${(data.count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Board Distribution */}
          {boards.length > 1 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Trong {Object.keys(stats.boardCounts).length} board
              </h3>
              <div className="space-y-2">
                {boards.map((board) => {
                  const count = stats.boardCounts[board._id] || 0;
                  if (count === 0) return null;
                  return (
                    <div key={board._id} className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{board.name}</span>
                      <span className="text-sm font-medium">{count}</span>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("title") + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              Lọc
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {/* Due date filter */}
            <DropdownMenuLabel>Ngày hạn</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={dueDateFilter === "all"}
              onCheckedChange={() => handleDueDateFilterChange("all")}
            >
              Tất cả
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dueDateFilter === "overdue"}
              onCheckedChange={() => handleDueDateFilterChange("overdue")}
            >
              <span className="text-red-500">Quá hạn</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dueDateFilter === "today"}
              onCheckedChange={() => handleDueDateFilterChange("today")}
            >
              Hôm nay
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dueDateFilter === "week"}
              onCheckedChange={() => handleDueDateFilterChange("week")}
            >
              Tuần này
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dueDateFilter === "no-date"}
              onCheckedChange={() => handleDueDateFilterChange("no-date")}
            >
              Chưa có ngày
            </DropdownMenuCheckboxItem>

            {/* Board filter */}
            {boards.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Board</DropdownMenuLabel>
                {boards.map((board) => (
                  <DropdownMenuCheckboxItem
                    key={board._id}
                    checked={filterBoards.includes(board._id)}
                    onCheckedChange={(checked) => {
                      const newFilters = checked
                        ? [...filterBoards, board._id]
                        : filterBoards.filter((id) => id !== board._id);
                      setFilterBoards(newFilters);
                      savePreferences({
                        filters: { boards: newFilters, statuses: filterStatuses, dueDateFilter },
                      });
                    }}
                  >
                    {board.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setFilterBoards([]);
                    setFilterStatuses([]);
                    setDueDateFilter("all");
                    savePreferences({
                      filters: { boards: [], statuses: [], dueDateFilter: "all" },
                    });
                  }}
                >
                  Xóa bộ lọc
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowUpDown className="h-4 w-4" />
              Sắp xếp
              {sortField && (
                <Badge variant="secondary" className="ml-1 px-1.5">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleSortChange("title")}>
              Tên {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("dueDate")}>
              Ngày hạn {sortField === "dueDate" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("createdAt")}>
              Ngày tạo {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("updatedAt")}>
              Cập nhật {sortField === "updatedAt" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            {sortField && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearSort}>
                  Xóa sắp xếp (dùng thứ tự tùy chỉnh)
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {viewMode === "all" ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
              {viewMode === "all" ? "Gộp" : "Theo board"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewModeChange("all")}>
              <List className="h-4 w-4 mr-2" />
              Gộp tất cả
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewModeChange("by-board")}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Theo board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Drag hint */}
      {viewMode === "all" && !sortField && sortedTasks.length > 1 && (
        <p className="text-xs text-muted-foreground">💡 Kéo thả để sắp xếp theo ý muốn</p>
      )}

      {/* Empty state */}
      {sortedTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">
            {tasks.length === 0 ? t("noTasks") : t("noResults")}
          </h3>
          <p className="text-muted-foreground mt-1">
            {tasks.length === 0 ? t("noTasksDesc") : t("noResultsDesc")}
          </p>
          {tasks.length === 0 && (
            <Link href="/dashboard/boards">
              <Button variant="outline" className="mt-4">
                Xem các board
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Task list - All mode with DnD */}
      {viewMode === "all" && sortedTasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedTasks.map((t) => t._id)}
            strategy={verticalListSortingStrategy}
            disabled={!!sortField}
          >
            <div className="space-y-1 border rounded-lg overflow-hidden">
              {sortedTasks.map((task) => {
                const board = getBoard(task.boardId);
                return (
                  <SortableTaskRow
                    key={task._id}
                    task={task}
                    board={board}
                    getTaskStatus={getTaskStatus}
                    getTaskDueDate={getTaskDueDate}
                    getBoardStatusProperty={getBoardStatusProperty}
                    getBoardDateProperty={getBoardDateProperty}
                    onUpdateTask={updateTask}
                    isUpdating={updatingTask === task._id}
                    isDragDisabled={!!sortField}
                    showBoard
                    locale={locale} // Pass locale for date formatting
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTask && (
              <div className="bg-background border rounded-lg shadow-lg p-3 opacity-90">
                <p className="text-sm font-medium">{activeTask.title || "Untitled"}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task list - By board mode */}
      {viewMode === "by-board" && sortedTasks.length > 0 && (
        <div className="space-y-4">
          {boards.map((board) => {
            const tasksInBoard = tasksByBoard[board._id];
            if (!tasksInBoard || tasksInBoard.length === 0) return null;

            // Check if all are filtered out
            if (filteredTasks.filter((t) => t.boardId === board._id).length === 0) return null;

            const isExpanded = expandedBoards.has(board._id);

            return (
              <div key={board._id} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer"
                  onClick={() => toggleBoard(board._id)}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", !isExpanded && "-rotate-90")}
                    />
                    <h3 className="font-medium">{board.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {tasksInBoard.length}
                    </Badge>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-1 space-y-1">
                    {tasksInBoard.map((task) => (
                      <SortableTaskRow
                        key={task._id}
                        task={task}
                        board={board}
                        getTaskStatus={getTaskStatus}
                        getTaskDueDate={getTaskDueDate}
                        getBoardStatusProperty={getBoardStatusProperty}
                        getBoardDateProperty={getBoardDateProperty}
                        onUpdateTask={updateTask}
                        isUpdating={updatingTask === task._id}
                        // Drag disabled in grouped view for now to keep it simple or implement specific handlers
                        isDragDisabled={true}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB COMPONENTS
// ============================================

interface SortableTaskRowProps {
  task: TaskData;
  board?: BoardData;
  getTaskStatus: (
    task: TaskData,
    board?: BoardData
  ) => { id: string; label: string; color?: string } | null;
  getTaskDueDate: (task: TaskData, board?: BoardData) => Date | null;
  getBoardStatusProperty: (board?: BoardData) => Property | undefined;
  getBoardDateProperty: (board?: BoardData) => Property | undefined;
  onUpdateTask: (
    taskId: string,
    boardId: string,
    updates: { properties?: Record<string, unknown> }
  ) => void;
  isUpdating: boolean;
  isDragDisabled?: boolean;
  showBoard?: boolean;
  locale?: string;
}

function SortableTaskRow({
  task,
  board,
  getTaskStatus,
  getTaskDueDate,
  getBoardStatusProperty,
  getBoardDateProperty: _getBoardDateProperty,
  onUpdateTask,
  isUpdating,
  isDragDisabled,
  showBoard,
  locale,
}: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : isUpdating ? 0.7 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  };

  const status = getTaskStatus(task, board);
  const dueDate = getTaskDueDate(task, board);
  const statusProp = getBoardStatusProperty(board);

  const handleStatusChange = (optionId: string | null) => {
    if (!statusProp) return;
    onUpdateTask(task._id, task.boardId, {
      properties: { [statusProp.id]: optionId },
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 bg-card hover:bg-muted/30 transition-colors",
        isDragging && "bg-muted shadow-sm"
      )}
    >
      {/* Drag Handle */}
      {!isDragDisabled && (
        <div
          {...attributes}
          {...listeners}
          className="text-muted-foreground/30 hover:text-foreground cursor-grab"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Done Checkbox approx */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-5 w-5 rounded-full border shrink-0 p-0",
          status ? "border-transparent" : "border-muted-foreground"
        )}
        onClick={() => {
          // Find "Done" status or similar? Or just toggle first/last?
          // Without known "Done" status logic, maybe open status picker?
        }}
      >
        {status ? (
          <div
            className={cn(
              "w-full h-full rounded-full flex items-center justify-center",
              status.color?.includes("green") ? "bg-green-500" : "bg-gray-400"
            )}
          >
            <CheckCircle2 className="h-3 w-3 text-white" />
          </div>
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground opacity-0" /> // Placeholder
        )}
      </Button>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium truncate",
              status?.label === "Done" && "line-through text-muted-foreground"
            )}
          >
            {task.title || "Untitled"}
          </span>
          {showBoard && board && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1 text-muted-foreground font-normal"
            >
              {board.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {dueDate && (
            <div
              className={cn(
                "flex items-center gap-1",
                isPast(dueDate) && !isToday(dueDate) && "text-red-500"
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {locale === "vi" ? format(dueDate, "dd/MM/yyyy") : format(dueDate, "MMM d")}
            </div>
          )}
        </div>
      </div>

      {/* Status Picker */}
      {statusProp && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1.5 text-xs font-normal bg-muted/50"
            >
              {status ? (
                <>
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      status.color?.includes("green") && "bg-green-500",
                      status.color?.includes("yellow") && "bg-yellow-500",
                      status.color?.includes("red") && "bg-red-500",
                      status.color?.includes("blue") && "bg-blue-500",
                      status.color?.includes("purple") && "bg-purple-500",
                      (!status.color || status.color === "gray") && "bg-gray-400"
                    )}
                  />
                  {status.label}
                </>
              ) : (
                <span>Set Status</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusProp.options?.map((opt) => (
              <DropdownMenuItem key={opt.id} onClick={() => handleStatusChange(opt.id)}>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    opt.color === "green" && "bg-green-500",
                    opt.color === "yellow" && "bg-yellow-500",
                    opt.color === "red" && "bg-red-500",
                    opt.color === "blue" && "bg-blue-500",
                    opt.color === "purple" && "bg-purple-500",
                    (!opt.color || opt.color === "gray") && "bg-gray-400"
                  )}
                />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Date Picker - Placeholder */}
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  );
}
