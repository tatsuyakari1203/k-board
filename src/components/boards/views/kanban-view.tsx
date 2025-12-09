"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import {
  type Property,
  type View,
  type FilterConfig,
  type SortConfig,
  PropertyType,
} from "@/types/board";
import { type TaskData } from "@/hooks/use-board-tasks";

// ============================================
// TYPES
// ============================================

interface UserOption {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface KanbanViewProps {
  board: {
    _id: string;
    properties: Property[];
  };
  tasks: TaskData[];
  view: View;
  searchQuery?: string;
  filters?: FilterConfig[];
  sorts?: SortConfig[];
  users?: UserOption[];
  onCreateTask: (title: string, properties?: Record<string, unknown>) => Promise<TaskData | null>;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (
    taskId: string,
    targetGroupValue: string | null,
    targetIndex: number,
    groupByPropertyId: string
  ) => void;
  onAddPropertyOption?: (
    propertyId: string,
    option: { id: string; label: string; color?: string }
  ) => void;
  onUpdatePropertyOption?: (
    propertyId: string,
    option: { id: string; label: string; color?: string }
  ) => void;
}

interface Column {
  id: string;
  title: string;
  color?: string;
  value: string | null; // null = "No Value" column
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPropertyValue(task: TaskData, propertyId: string): unknown {
  return task.properties?.[propertyId];
}

function matchesSearch(task: TaskData, query: string, properties: Property[]): boolean {
  if (!query.trim()) return true;
  const lowerQuery = query.toLowerCase();

  // Search in title
  if (task.title.toLowerCase().includes(lowerQuery)) return true;

  // Search in text properties
  for (const prop of properties) {
    if (prop.type === PropertyType.TEXT || prop.type === PropertyType.RICH_TEXT) {
      const value = task.properties?.[prop.id];
      if (typeof value === "string" && value.toLowerCase().includes(lowerQuery)) {
        return true;
      }
    }
  }

  return false;
}

function matchesFilters(task: TaskData, filters: FilterConfig[], properties: Property[]): boolean {
  if (!filters || filters.length === 0) return true;

  return filters.every((filter) => {
    const property = properties.find((p) => p.id === filter.propertyId);
    if (!property) return true;

    const value = task.properties?.[filter.propertyId];

    switch (filter.operator) {
      case "equals":
        return value === filter.value;
      case "not_equals":
        return value !== filter.value;
      case "contains":
        return typeof value === "string" && value.includes(filter.value as string);
      case "is_empty":
        return value === null || value === undefined || value === "";
      case "is_not_empty":
        return value !== null && value !== undefined && value !== "";
      case "greater_than":
        return typeof value === "number" && value > (filter.value as number);
      case "less_than":
        return typeof value === "number" && value < (filter.value as number);
      default:
        return true;
    }
  });
}

function sortTasks(tasks: TaskData[], sorts: SortConfig[], properties: Property[]): TaskData[] {
  if (!sorts || sorts.length === 0) {
    return tasks.sort((a, b) => a.order - b.order);
  }

  return [...tasks].sort((a, b) => {
    for (const sort of sorts) {
      const property = properties.find((p) => p.id === sort.propertyId);
      if (!property) continue;

      const aVal = a.properties?.[sort.propertyId];
      const bVal = b.properties?.[sort.propertyId];

      let comparison = 0;

      if (aVal === bVal) continue;
      if (aVal === null || aVal === undefined) comparison = 1;
      else if (bVal === null || bVal === undefined) comparison = -1;
      else if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      }

      if (comparison !== 0) {
        return sort.direction === "desc" ? -comparison : comparison;
      }
    }
    return a.order - b.order;
  });
}

// ============================================
// MAIN COMPONENT
// ============================================

export function KanbanView({
  board,
  tasks,
  view,
  searchQuery = "",
  filters = [],
  sorts = [],
  users = [],
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onAddPropertyOption,
  onUpdatePropertyOption,
}: KanbanViewProps) {
  const t = useTranslations("BoardDetails.kanban");
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Get groupBy property - default to first STATUS property if not set
  const groupByPropertyId = useMemo(() => {
    if (view.config.groupBy) return view.config.groupBy;

    // Find first status property as default
    const statusProperty = board.properties.find((p) => p.type === PropertyType.STATUS);
    return statusProperty?.id;
  }, [view.config.groupBy, board.properties]);

  const groupByProperty = board.properties.find((p) => p.id === groupByPropertyId);

  // Configure sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Apply search
    if (searchQuery) {
      result = result.filter((t) => matchesSearch(t, searchQuery, board.properties));
    }

    // Apply filters
    if (filters.length > 0) {
      result = result.filter((t) => matchesFilters(t, filters, board.properties));
    }

    // Apply sorts
    result = sortTasks(result, sorts, board.properties);

    return result;
  }, [tasks, searchQuery, filters, sorts, board.properties]);

  // Handlers for column actions
  const handleRenameColumn = (columnId: string, newTitle: string) => {
    if (!groupByProperty || !onUpdatePropertyOption) return;

    // Check if column is an option (not "all" or "no-value")
    const option = groupByProperty.options?.find((opt) => opt.id === columnId);
    if (!option) {
      toast.error(t("cannotRenameSystemColumn"));
      return;
    }

    if (newTitle && newTitle !== option.label) {
      onUpdatePropertyOption(groupByProperty.id, {
        id: columnId,
        label: newTitle,
      });
    }
  };

  const handleHideColumn = (columnId: string) => {
    // TODO: Implement column hiding via filters or view config
    console.log("Hide column:", columnId);
    toast.info(t("hideColumn") + ": " + t("comingSoon"));
  };

  // Build columns from groupBy property options
  const columns = useMemo((): Column[] => {
    if (!groupByProperty) {
      // No groupBy, show all in one column
      return [{ id: "all", title: t("allTasks"), value: null }];
    }

    const options = groupByProperty.options || [];
    const cols: Column[] = options.map((opt) => ({
      id: opt.id,
      title: opt.label,
      color: opt.color,
      value: opt.id,
    }));

    // Add "No Value" column
    cols.push({
      id: "__no_value__",
      title: t("noValue"),
      value: null,
    });

    return cols;
  }, [groupByProperty, t]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, TaskData[]> = {};

    // Initialize all columns
    columns.forEach((col) => {
      grouped[col.id] = [];
    });

    // Group tasks
    filteredTasks.forEach((task) => {
      if (!groupByPropertyId) {
        grouped["all"]?.push(task);
        return;
      }

      const value = getPropertyValue(task, groupByPropertyId);

      // Find matching column
      const column = columns.find((col) => {
        if (col.value === null) {
          return value === null || value === undefined || value === "";
        }
        return col.value === value;
      });

      if (column) {
        grouped[column.id]?.push(task);
      } else {
        // Put in "No Value" if no match
        grouped["__no_value__"]?.push(task);
      }
    });

    // Sort tasks within each column
    Object.keys(grouped).forEach((colId) => {
      grouped[colId] = grouped[colId].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [filteredTasks, columns, groupByPropertyId]);

  // Visible properties for cards (excluding groupBy)
  const cardProperties = useMemo(() => {
    const visible = view.config.visibleProperties || board.properties.map((p) => p.id);
    return board.properties
      .filter((p) => visible.includes(p.id) && p.id !== groupByPropertyId)
      .slice(0, 4); // Max 4 properties on card
  }, [board.properties, view.config.visibleProperties, groupByPropertyId]);

  // Calculate aggregations per column
  const columnAggregations = useMemo(() => {
    const aggregations: Record<string, { sum: number; count: number }> = {};

    // Find number/currency properties for aggregation
    const numberProps = board.properties.filter(
      (p) => p.type === PropertyType.NUMBER || p.type === PropertyType.CURRENCY
    );

    columns.forEach((col) => {
      const colTasks = tasksByColumn[col.id] || [];
      let totalSum = 0;
      let countWithValue = 0;

      colTasks.forEach((task) => {
        numberProps.forEach((prop) => {
          const value = task.properties?.[prop.id];
          if (typeof value === "number") {
            totalSum += value;
            countWithValue++;
          }
        });
      });

      aggregations[col.id] = { sum: totalSum, count: countWithValue };
    });

    return aggregations;
  }, [columns, tasksByColumn, board.properties]);

  // ============================================
  // DRAG HANDLERS
  // ============================================

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks.find((t) => t._id === active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [tasks]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id?.toString() || null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      setOverId(null);

      if (!over) return;

      const taskId = active.id.toString();
      const overId = over.id.toString();

      // Find source and target columns
      let targetColumnId: string | null = null;
      let targetIndex = 0;

      // Check if dropped on a column
      const targetColumn = columns.find((col) => col.id === overId);
      if (targetColumn) {
        targetColumnId = targetColumn.id;
        targetIndex = tasksByColumn[targetColumnId]?.length || 0;
      } else {
        // Dropped on a task - find its column and position
        for (const [colId, colTasks] of Object.entries(tasksByColumn)) {
          const taskIndex = colTasks.findIndex((t) => t._id === overId);
          if (taskIndex !== -1) {
            targetColumnId = colId;
            targetIndex = taskIndex;
            break;
          }
        }
      }

      if (!targetColumnId) return;

      // Get target column value
      const column = columns.find((c) => c.id === targetColumnId);
      if (!column) return;

      // Call move handler
      if (groupByPropertyId) {
        onMoveTask(taskId, column.value, targetIndex, groupByPropertyId);
      }
    },
    [columns, tasksByColumn, onMoveTask, groupByPropertyId]
  );

  // ============================================
  // CREATE TASK IN COLUMN
  // ============================================

  const handleCreateTaskInColumn = useCallback(
    async (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      const properties: Record<string, unknown> = {};
      if (groupByPropertyId && column.value !== null) {
        properties[groupByPropertyId] = column.value;
      }

      await onCreateTask(t("newTask"), properties);
    },
    [columns, groupByPropertyId, onCreateTask, t]
  );

  // ============================================
  // RENDER
  // ============================================

  // Show message if no groupBy property (no status property found)
  if (!groupByProperty) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t("noStatusMessage")}</p>
          <p className="text-sm text-muted-foreground">{t("noStatusAction")}</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Notion-style: horizontal scroll, generous padding, clean gaps */}
      <div className="flex h-full overflow-x-auto px-6 py-4 gap-6 md:px-6 px-3 md:gap-6 gap-3">
        {columns.map((column) => {
          const agg = columnAggregations[column.id];
          const aggregations =
            agg && agg.sum > 0 ? [{ type: "sum" as const, value: agg.sum, label: "Σ" }] : [];

          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={tasksByColumn[column.id]?.length || 0}
              aggregations={aggregations}
              isOver={overId === column.id}
              onAddCard={() => handleCreateTaskInColumn(column.id)}
              onRename={(newTitle) => handleRenameColumn(column.id, newTitle)}
              onHide={() => handleHideColumn(column.id)}
            >
              <SortableContext
                items={tasksByColumn[column.id]?.map((t) => t._id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {tasksByColumn[column.id]?.map((task) => (
                    <KanbanCard
                      key={task._id}
                      task={task}
                      properties={cardProperties}
                      allProperties={board.properties}
                      users={users}
                      onUpdate={(updates: Partial<TaskData>) => onUpdateTask(task._id, updates)}
                      onDelete={() => onDeleteTask(task._id)}
                      onAddPropertyOption={onAddPropertyOption}
                      onUpdatePropertyOption={onUpdatePropertyOption}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Add card button - Notion style: text only, subtle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-1"
                onClick={() => handleCreateTaskInColumn(column.id)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="text-sm">{t("addCard")}</span>
              </Button>
            </KanbanColumn>
          );
        })}

        {/* Add column button - future feature */}
        <div className="w-[280px] min-w-[280px] md:w-[280px] md:min-w-[280px] w-[240px] min-w-[240px] shrink-0 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            className="w-full h-10 justify-start text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("addColumn")}
          </Button>
        </div>
      </div>

      {/* Drag Overlay - floating card effect */}
      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="rotate-3 opacity-90">
            <KanbanCard
              task={activeTask}
              properties={cardProperties}
              users={users}
              isDragging
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
