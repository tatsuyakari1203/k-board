"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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
  ExternalLink,
  Search,
  ArrowUpDown,
  Filter,
  GripVertical,
  X,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { format, isToday, isPast, isThisWeek, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PropertyType, type Property } from "@/types/board";
import { toast } from "sonner";

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
  const [dueDateFilter, setDueDateFilter] = useState<"all" | "overdue" | "today" | "week" | "no-date">("all");

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
      toast.error("Không thể tải công việc");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const updateTask = useCallback(async (
    taskId: string,
    boardId: string,
    updates: { properties?: Record<string, unknown> }
  ) => {
    setUpdatingTask(taskId);
    try {
      const res = await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(prev => prev.map(t =>
          t._id === taskId ? { ...t, ...updatedTask } : t
        ));
        toast.success("Đã cập nhật");
      } else {
        toast.error("Không thể cập nhật");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Không thể cập nhật");
    } finally {
      setUpdatingTask(null);
    }
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleViewModeChange = (mode: "all" | "by-board") => {
    setViewMode(mode);
    savePreferences({ viewMode: mode });
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction
      const newDir = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDir);
      savePreferences({ sortDirection: newDir });
    } else {
      setSortField(field);
      setSortDirection("desc");
      savePreferences({ sortField: field, sortDirection: "desc" });
    }
  };

  const handleClearSort = () => {
    setSortField(null);
    savePreferences({ sortField: null });
  };

  const handleShowAllTasksChange = (show: boolean) => {
    setShowAllTasks(show);
    savePreferences({ showAllTasks: show });
    // Refetch to get updated task list
    setLoading(true);
    fetchTasks();
  };

  const handleDueDateFilterChange = (filter: typeof dueDateFilter) => {
    setDueDateFilter(filter);
    savePreferences({ filters: { boards: filterBoards, statuses: filterStatuses, dueDateFilter: filter } });
  };

  const toggleBoard = (boardId: string) => {
    setExpandedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) {
        next.delete(boardId);
      } else {
        next.add(boardId);
      }
      return next;
    });
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Get status property and options for a board
  const getBoardStatusProperty = useCallback((board: BoardData) => {
    return board.properties.find(p => p.type === PropertyType.STATUS);
  }, []);

  // Get date property for a board
  const getBoardDateProperty = useCallback((board: BoardData) => {
    return board.properties.find(p => p.type === PropertyType.DATE);
  }, []);

  // Get task status
  const getTaskStatus = useCallback((task: TaskData, board: BoardData | undefined) => {
    if (!board) return null;
    const statusProp = getBoardStatusProperty(board);
    if (!statusProp) return null;
    const value = task.properties[statusProp.id] as string | undefined;
    if (!value) return null;
    return statusProp.options?.find(o => o.id === value);
  }, [getBoardStatusProperty]);

  // Get task due date
  const getTaskDueDate = useCallback((task: TaskData, board: BoardData | undefined) => {
    if (!board) return null;
    const dateProp = getBoardDateProperty(board);
    if (!dateProp) return null;
    return task.properties[dateProp.id] as string | undefined;
  }, [getBoardDateProperty]);

  // Get board by id
  const getBoard = useCallback((boardId: string) => {
    return boards.find(b => b._id === boardId);
  }, [boards]);

  // Filter and sort tasks
  const sortedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(query));
    }

    // Apply board filter
    if (filterBoards.length > 0) {
      result = result.filter(t => filterBoards.includes(t.boardId));
    }

    // Apply status filter
    if (filterStatuses.length > 0) {
      result = result.filter(t => {
        const board = getBoard(t.boardId);
        const status = getTaskStatus(t, board);
        return status && filterStatuses.includes(status.id);
      });
    }

    // Apply due date filter
    if (dueDateFilter !== "all") {
      result = result.filter(t => {
        const board = getBoard(t.boardId);
        const dueDate = getTaskDueDate(t, board);

        if (dueDateFilter === "no-date") {
          return !dueDate;
        }

        if (!dueDate) return false;
        const date = startOfDay(new Date(dueDate));
        const today = startOfDay(new Date());

        switch (dueDateFilter) {
          case "overdue":
            return isPast(date) && !isToday(date);
          case "today":
            return isToday(date);
          case "week":
            return isThisWeek(date, { weekStartsOn: 1 });
          default:
            return true;
        }
      });
    }

    // Apply sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal: string | number, bVal: string | number;

        switch (sortField) {
          case "title":
            aVal = a.title?.toLowerCase() || "";
            bVal = b.title?.toLowerCase() || "";
            break;
          case "createdAt":
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case "updatedAt":
            aVal = new Date(a.updatedAt).getTime();
            bVal = new Date(b.updatedAt).getTime();
            break;
          case "dueDate":
            const boardA = getBoard(a.boardId);
            const boardB = getBoard(b.boardId);
            const dateA = getTaskDueDate(a, boardA);
            const dateB = getTaskDueDate(b, boardB);
            aVal = dateA ? new Date(dateA).getTime() : Infinity;
            bVal = dateB ? new Date(dateB).getTime() : Infinity;
            break;
          default:
            return 0;
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else if (customOrder.length > 0) {
      // Apply custom order
      result.sort((a, b) => {
        const aIndex = customOrder.indexOf(a._id);
        const bIndex = customOrder.indexOf(b._id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return result;
  }, [tasks, searchQuery, filterBoards, filterStatuses, dueDateFilter, sortField, sortDirection, customOrder, getBoard, getTaskStatus, getTaskDueDate]);

  // Group tasks by board
  const tasksByBoard = useMemo(() => {
    const grouped: Record<string, TaskData[]> = {};
    boards.forEach(b => {
      grouped[b._id] = [];
    });
    sortedTasks.forEach(t => {
      if (grouped[t.boardId]) {
        grouped[t.boardId].push(t);
      }
    });
    return grouped;
  }, [sortedTasks, boards]);

  // Statistics
  const stats = useMemo(() => {
    let overdue = 0;
    let today = 0;

    tasks.forEach(t => {
      const board = getBoard(t.boardId);
      const dueDate = getTaskDueDate(t, board);
      if (dueDate) {
        const date = startOfDay(new Date(dueDate));
        if (isToday(date)) today++;
        else if (isPast(date)) overdue++;
      }
    });

    return { overdue, today, total: tasks.length };
  }, [tasks, getBoard, getTaskDueDate]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterBoards.length > 0) count++;
    if (filterStatuses.length > 0) count++;
    if (dueDateFilter !== "all") count++;
    return count;
  }, [filterBoards, filterStatuses, dueDateFilter]);

  // ============================================
  // DND HANDLERS
  // ============================================

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t._id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const oldIndex = sortedTasks.findIndex(t => t._id === active.id);
    const newIndex = sortedTasks.findIndex(t => t._id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(
        sortedTasks.map(t => t._id),
        oldIndex,
        newIndex
      );
      setCustomOrder(newOrder);
      savePreferences({ customOrder: newOrder });
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
          <h1 className="text-2xl font-bold">Công việc của tôi</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{stats.total} công việc</span>
            {stats.overdue > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-3 w-3" />
                {stats.overdue} quá hạn
              </span>
            )}
            {stats.today > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Clock className="h-3 w-3" />
                {stats.today} hôm nay
              </span>
            )}
          </div>
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
              Xem tất cả
            </Label>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
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
                {boards.map(board => (
                  <DropdownMenuCheckboxItem
                    key={board._id}
                    checked={filterBoards.includes(board._id)}
                    onCheckedChange={(checked) => {
                      const newFilters = checked
                        ? [...filterBoards, board._id]
                        : filterBoards.filter(id => id !== board._id);
                      setFilterBoards(newFilters);
                      savePreferences({ filters: { boards: newFilters, statuses: filterStatuses, dueDateFilter } });
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
                    savePreferences({ filters: { boards: [], statuses: [], dueDateFilter: "all" } });
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
              {viewMode === "all" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
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
        <p className="text-xs text-muted-foreground">
          💡 Kéo thả để sắp xếp theo ý muốn
        </p>
      )}

      {/* Empty state */}
      {sortedTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">
            {tasks.length === 0 ? "Không có công việc nào" : "Không có kết quả"}
          </h3>
          <p className="text-muted-foreground mt-1">
            {tasks.length === 0
              ? "Bạn chưa được giao công việc nào."
              : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."}
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
            items={sortedTasks.map(t => t._id)}
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
                    boards={boards}
                    getTaskStatus={getTaskStatus}
                    getTaskDueDate={getTaskDueDate}
                    getBoardStatusProperty={getBoardStatusProperty}
                    getBoardDateProperty={getBoardDateProperty}
                    onUpdateTask={updateTask}
                    isUpdating={updatingTask === task._id}
                    isDragDisabled={!!sortField}
                    showBoard
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
            const boardTasks = tasksByBoard[board._id] || [];
            if (boardTasks.length === 0) return null;

            const isExpanded = expandedBoards.has(board._id);

            return (
              <div key={board._id} className="border rounded-lg overflow-hidden">
                {/* Board header */}
                <div className="flex items-center justify-between p-4 bg-muted/30">
                  <button
                    className="flex items-center gap-3 flex-1"
                    onClick={() => toggleBoard(board._id)}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        !isExpanded && "-rotate-90"
                      )}
                    />
                    <span className="font-medium">{board.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {boardTasks.length} công việc
                    </span>
                  </button>
                  <Link href={`/dashboard/boards/${board._id}`}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Tasks */}
                {isExpanded && (
                  <div className="divide-y">
                    {boardTasks.map((task) => (
                      <TaskRow
                        key={task._id}
                        task={task}
                        board={board}
                        boards={boards}
                        getTaskStatus={getTaskStatus}
                        getTaskDueDate={getTaskDueDate}
                        getBoardStatusProperty={getBoardStatusProperty}
                        getBoardDateProperty={getBoardDateProperty}
                        onUpdateTask={updateTask}
                        isUpdating={updatingTask === task._id}
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
// SORTABLE TASK ROW
// ============================================

interface TaskRowProps {
  task: TaskData;
  board: BoardData | undefined;
  boards: BoardData[];
  getTaskStatus: (task: TaskData, board: BoardData | undefined) => { id: string; label: string; color?: string } | null | undefined;
  getTaskDueDate: (task: TaskData, board: BoardData | undefined) => string | null | undefined;
  getBoardStatusProperty: (board: BoardData) => Property | undefined;
  getBoardDateProperty: (board: BoardData) => Property | undefined;
  onUpdateTask: (taskId: string, boardId: string, updates: { properties?: Record<string, unknown> }) => void;
  isUpdating: boolean;
  showBoard?: boolean;
  isDragDisabled?: boolean;
}

function SortableTaskRow(props: TaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.task._id,
    disabled: props.isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50")}
    >
      <TaskRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function TaskRow({
  task,
  board,
  getTaskStatus,
  getTaskDueDate,
  getBoardStatusProperty,
  getBoardDateProperty,
  onUpdateTask,
  isUpdating,
  showBoard,
  dragHandleProps,
}: TaskRowProps & { dragHandleProps?: Record<string, unknown> }) {
  const status = getTaskStatus(task, board);
  const dueDate = getTaskDueDate(task, board);
  const statusProp = board ? getBoardStatusProperty(board) : undefined;
  const dateProp = board ? getBoardDateProperty(board) : undefined;

  const isOverdue = useMemo(() => {
    if (!dueDate) return false;
    const date = startOfDay(new Date(dueDate));
    return isPast(date) && !isToday(date);
  }, [dueDate]);

  const isDueToday = useMemo(() => {
    if (!dueDate) return false;
    return isToday(new Date(dueDate));
  }, [dueDate]);

  // Handle status change
  const handleStatusChange = (newStatusId: string) => {
    if (!statusProp) return;
    onUpdateTask(task._id, task.boardId, {
      properties: { [statusProp.id]: newStatusId }
    });
  };

  // Handle due date change
  const handleDueDateChange = (newDate: Date | undefined) => {
    if (!dateProp) return;
    onUpdateTask(task._id, task.boardId, {
      properties: { [dateProp.id]: newDate?.toISOString() || null }
    });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors group">
      {/* Drag handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted shrink-0"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Status indicator - clickable */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={!statusProp || isUpdating}>
          <button className="shrink-0 focus:outline-none" disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : status ? (
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-transform hover:scale-110",
                  status.color?.includes("green") && "border-green-500 bg-green-100",
                  status.color?.includes("yellow") && "border-yellow-500 bg-yellow-100",
                  status.color?.includes("red") && "border-red-500 bg-red-100",
                  status.color?.includes("blue") && "border-blue-500 bg-blue-100",
                  status.color?.includes("purple") && "border-purple-500 bg-purple-100",
                  status.color?.includes("gray") && "border-gray-400 bg-gray-100",
                  !status.color && "border-gray-300"
                )}
              />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {statusProp?.options?.map((opt) => (
            <DropdownMenuItem
              key={opt.id}
              onClick={() => handleStatusChange(opt.id)}
            >
              <span
                className={cn(
                  "inline-block w-3 h-3 rounded-full mr-2",
                  opt.color?.includes("green") && "bg-green-500",
                  opt.color?.includes("yellow") && "bg-yellow-500",
                  opt.color?.includes("red") && "bg-red-500",
                  opt.color?.includes("blue") && "bg-blue-500",
                  opt.color?.includes("purple") && "bg-purple-500",
                  opt.color?.includes("gray") && "bg-gray-400",
                  !opt.color && "bg-gray-400"
                )}
              />
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Title - link to board */}
      <Link
        href={`/dashboard/boards/${task.boardId}`}
        className="flex-1 min-w-0"
      >
        <p className="text-sm truncate hover:text-primary transition-colors">
          {task.title || "Untitled"}
        </p>
      </Link>

      {/* Board name */}
      {showBoard && board && (
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded shrink-0 hidden sm:inline-block">
          {board.name}
        </span>
      )}

      {/* Status badge - clickable */}
      {status && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={!statusProp || isUpdating}>
            <button
              className={cn(
                "text-xs px-2 py-0.5 rounded shrink-0 transition-opacity hover:opacity-80",
                status.color || "bg-gray-100 text-gray-700"
              )}
              disabled={isUpdating}
            >
              {status.label}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusProp?.options?.map((opt) => (
              <DropdownMenuItem
                key={opt.id}
                onClick={() => handleStatusChange(opt.id)}
              >
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs mr-2",
                    opt.color || "bg-gray-100 text-gray-700"
                  )}
                >
                  {opt.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Due date - clickable calendar */}
      <Popover>
        <PopoverTrigger asChild disabled={!dateProp || isUpdating}>
          <button
            className={cn(
              "flex items-center gap-1 text-xs shrink-0 px-1.5 py-0.5 rounded transition-colors",
              dueDate ? (
                isOverdue ? "text-red-500 bg-red-50 hover:bg-red-100" :
                isDueToday ? "text-orange-500 bg-orange-50 hover:bg-orange-100" :
                "text-muted-foreground hover:bg-muted"
              ) : "text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100"
            )}
            disabled={isUpdating}
          >
            <Calendar className="h-3 w-3" />
            {dueDate ? (
              <span>{format(new Date(dueDate), "dd/MM", { locale: vi })}</span>
            ) : (
              <span>Thêm</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            mode="single"
            selected={dueDate ? new Date(dueDate) : undefined}
            onSelect={handleDueDateChange}
            locale={vi}
            initialFocus
          />
          {dueDate && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive"
                onClick={() => handleDueDateChange(undefined)}
              >
                Xóa ngày
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
