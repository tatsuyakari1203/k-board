"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Plus, GripVertical, Trash2, MoreHorizontal, ChevronRight, ChevronDown, X } from "lucide-react";
import { PropertyCell } from "./property-cell";
import {
  type Property,
  type View,
  type SortConfig,
  type FilterConfig,
  PropertyType,
  AggregationType,
} from "@/types/board";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface TaskData {
  _id: string;
  title: string;
  properties: Record<string, unknown>;
  order: number;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface TableViewProps {
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
  onCreateTask: (title: string) => Promise<TaskData | null>;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => void;
  onDeleteTask: (taskId: string) => void;
  onRemoveProperty?: (propertyId: string) => void;
  onAddPropertyOption?: (propertyId: string, option: { id: string; label: string; color?: string }) => void;
  onUpdatePropertyWidth?: (propertyId: string, width: number) => void;
  onReorderTasks?: (oldIndex: number, newIndex: number) => void;
  onReorderProperties?: (oldIndex: number, newIndex: number) => void;
  onRenameProperty?: (propertyId: string, newName: string) => void;
  onAddPropertyAt?: (index: number) => void;
  onUpdateAggregation?: (propertyId: string, type: AggregationType | null) => void;
  groupBy?: string;
  onBulkDeleteTasks?: (taskIds: string[]) => void;
}

// Helper to extract date value
function getDateValue(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'from' in value) {
    return (value as any).from;
  }
  return String(value);
}

// Helper to calculate aggregation
function calculateAggregation(tasks: TaskData[], property: Property, type: AggregationType): string | number {
  const values = tasks.map(t => (t.properties || {})[property.id]).filter(v => v !== undefined && v !== null && v !== "");
  const allCount = tasks.length;
  const notEmptyCount = values.length;
  const emptyCount = allCount - notEmptyCount;

  switch (type) {
    case AggregationType.COUNT: return allCount;
    case AggregationType.COUNT_EMPTY: return emptyCount;
    case AggregationType.COUNT_NOT_EMPTY: return notEmptyCount;
    case AggregationType.PERCENT_EMPTY: return allCount ? Math.round((emptyCount / allCount) * 100) + "%" : "0%";
    case AggregationType.PERCENT_NOT_EMPTY: return allCount ? Math.round((notEmptyCount / allCount) * 100) + "%" : "0%";
  }

  // Numeric calculations
  if (property.type === PropertyType.NUMBER || property.type === PropertyType.CURRENCY) {
    const numbers = values.map(v => Number(v)).filter(n => !isNaN(n));
    if (numbers.length === 0) return 0;

    const sum = numbers.reduce((a, b) => a + b, 0);

    switch (type) {
      case AggregationType.SUM: return sum;
      case AggregationType.AVERAGE: return Math.round((sum / numbers.length) * 100) / 100;
      case AggregationType.MIN: return Math.min(...numbers);
      case AggregationType.MAX: return Math.max(...numbers);
      case AggregationType.RANGE: return Math.max(...numbers) - Math.min(...numbers);
      case AggregationType.MEDIAN: {
        numbers.sort((a, b) => a - b);
        const mid = Math.floor(numbers.length / 2);
        return numbers.length % 2 !== 0 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;
      }
    }
  }

  return "";
}

// Helper to compare values for sorting
function compareValues(a: unknown, b: unknown, type: PropertyType): number {
  if (a === undefined || a === null) return 1;
  if (b === undefined || b === null) return -1;

  switch (type) {
    case PropertyType.NUMBER:
    case PropertyType.CURRENCY:
      return Number(a) - Number(b);
    case PropertyType.DATE:
      const dateA = getDateValue(a);
      const dateB = getDateValue(b);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    case PropertyType.CHECKBOX:
      return (a ? 1 : 0) - (b ? 1 : 0);
    default:
      return String(a).localeCompare(String(b));
  }
}

// Helper to check if task matches filter
function matchesFilter(task: TaskData, filter: FilterConfig, properties: Property[]): boolean {
  const taskProps = task.properties || {};
  let value = taskProps[filter.propertyId];

  // Handle date objects for filtering
  const property = properties.find(p => p.id === filter.propertyId);
  if (property?.type === PropertyType.DATE) {
    value = getDateValue(value);
  }

  switch (filter.operator) {
    case "is_empty":
      return value === undefined || value === null || value === "";
    case "is_not_empty":
      return value !== undefined && value !== null && value !== "";
    case "equals":
      return String(value) === String(filter.value);
    case "not_equals":
      return String(value) !== String(filter.value);
    case "contains":
      return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case "greater_than":
      return Number(value) > Number(filter.value);
    case "less_than":
      return Number(value) < Number(filter.value);
    case "greater_or_equal":
      return Number(value) >= Number(filter.value);
    case "less_or_equal":
      return Number(value) <= Number(filter.value);
    case "before":
      return new Date(String(value)) < new Date(String(filter.value));
    case "after":
      return new Date(String(value)) > new Date(String(filter.value));
    default:
      return true;
  }
}

// Sortable Header Component
function SortableHeader({
  property,
  width,
  index,
  onResize,
  onRemove,
  onRename,
  onAddAt,
}: {
  property: Property;
  width: number;
  index: number;
  onResize: (e: React.MouseEvent, id: string) => void;
  onRemove?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onAddAt?: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: property.id,
    data: {
      type: "COLUMN",
      property,
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(property.name);

  const handleRenameSubmit = () => {
    if (editValue.trim() && editValue !== property.name && onRename) {
      onRename(property.id, editValue.trim());
    } else {
      setEditValue(property.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setEditValue(property.name);
      setIsEditing(false);
    }
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    width: width,
    minWidth: 80,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="text-left font-medium text-muted-foreground py-2 px-3 bg-background relative group/header"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex-1 flex items-center min-w-0 cursor-grab active:cursor-grabbing mr-1"
          {...attributes}
          {...listeners}
        >
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              className="w-full bg-background border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate select-none">{property.name}</span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-accent rounded transition-opacity shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRename && (
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                Đổi tên
              </DropdownMenuItem>
            )}
            {onAddAt && (
              <>
                <DropdownMenuItem onClick={() => onAddAt(index)}>
                  Thêm cột trái
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddAt(index + 1)}>
                  Thêm cột phải
                </DropdownMenuItem>
              </>
            )}
            {(onRemove || onRename || onAddAt) && <DropdownMenuSeparator />}
            {onRemove && (
              <DropdownMenuItem
                onClick={() => onRemove(property.id)}
                className="text-destructive"
              >
                Xóa cột
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation(); // Prevent drag start
          onResize(e, property.id);
        }}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
      />
    </th>
  );
}
// Sortable Row Component
function SortableRow({
  task,
  visibleProperties,
  columnWidths,
  onUpdateTask,
  onDeleteTask,
  users,
  onAddPropertyOption,
  isDragEnabled,
  isSelected,
  onToggleSelect,
  visualIndex,
  onFillStart,
  onFillMove,
  fillRange,
  isTitleVisible,
}: {
  task: TaskData;
  visibleProperties: Property[];
  columnWidths: Record<string, number>;
  onUpdateTask: (id: string, updates: Partial<TaskData>) => void;
  onDeleteTask: (id: string) => void;
  users?: UserOption[];
  onAddPropertyOption?: (id: string, option: any) => void;
  isDragEnabled: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  visualIndex: number;
  onFillStart: (e: React.MouseEvent, taskId: string, propertyId: string, value: unknown, index: number) => void;
  onFillMove: (index: number) => void;
  fillRange: { start: number; end: number; propertyId: string } | null;
  isTitleVisible: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: {
      type: "TASK",
      task,
    },
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 100 : "auto",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-accent/30 transition-colors group ${isSelected ? "bg-accent/40" : ""}`}
      onMouseEnter={() => onFillMove(visualIndex)}
    >
      <td className="w-8 text-center border-r p-0 bg-background sticky left-0 z-20">
        <div className="flex items-center justify-center h-full w-full">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(task._id);
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
        </div>
      </td>
      <td className="w-8 text-center sticky left-8 z-20 bg-background border-r">
        {isDragEnabled && (
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-opacity"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </td>
      {isTitleVisible && (
        <td className="py-1 px-3 sticky left-16 bg-background border-r z-20 group-hover:bg-accent/30">
          <input
            type="text"
            value={task.title}
            onChange={(e) => onUpdateTask(task._id, { title: e.target.value })}
            className="w-full bg-transparent border-none outline-none py-1.5 px-0 focus:ring-0"
            placeholder="Untitled"
          />
        </td>
      )}
      {visibleProperties.map((property) => {
        const taskProps = task.properties || {};
        const isInFillRange = fillRange &&
          fillRange.propertyId === property.id &&
          visualIndex >= Math.min(fillRange.start, fillRange.end) &&
          visualIndex <= Math.max(fillRange.start, fillRange.end);

        return (
          <td
            key={property.id}
            className={cn(
              "py-1 px-3 relative group/cell border-r border-transparent hover:border-border",
              isInFillRange && "bg-primary/10 ring-1 ring-primary inset-0"
            )}
            style={{ width: columnWidths[property.id] || 150, minWidth: 80 }}
          >
            <PropertyCell
              property={property}
              value={taskProps[property.id]}
              onChange={(value) =>
                onUpdateTask(task._id, {
                  properties: { ...taskProps, [property.id]: value },
                })
              }
              onAddOption={onAddPropertyOption}
              users={users}
            />
            {/* Fill Handle */}
            <div
              className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-tl-sm cursor-crosshair opacity-0 group-hover/cell:opacity-100 transition-opacity z-20"
              onMouseDown={(e) => {
                e.stopPropagation(); // Prevent row drag
                onFillStart(e, task._id, property.id, taskProps[property.id], visualIndex);
              }}
            />
          </td>
        );
      })}
      <td className="w-10 text-center">
        <button
          onClick={() => onDeleteTask(task._id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// Group Header Component
function GroupHeader({
  title,
  count,
  color,
  isExpanded,
  onToggle,
  colSpan
}: {
  title: string;
  count: number;
  color?: string;
  isExpanded: boolean;
  onToggle: () => void;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="bg-muted/30 border-b py-1.5 px-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors text-left"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {color && <div className={`w-2 h-2 rounded-full ${color.split(" ")[0].replace("text-", "bg-")}`} />}
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-muted-foreground ml-1">{count}</span>
        </button>
      </td>
    </tr>
  );
}

export function TableView({
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
  onRemoveProperty,
  onAddPropertyOption,
  onUpdatePropertyWidth,
  onReorderTasks,
  onReorderProperties,
  onRenameProperty,
  onAddPropertyAt,
  onUpdateAggregation,
  groupBy,
  onBulkDeleteTasks,
}: TableViewProps) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ id: string; startX: number; startWidth: number } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [fillRange, setFillRange] = useState<{ start: number; end: number; propertyId: string; value: unknown } | null>(null);

  const AGGREGATION_LABELS: Record<string, string> = {
    [AggregationType.COUNT]: "Đếm tất cả",
    [AggregationType.COUNT_EMPTY]: "Đếm trống",
    [AggregationType.COUNT_NOT_EMPTY]: "Đếm có dữ liệu",
    [AggregationType.PERCENT_EMPTY]: "% Trống",
    [AggregationType.PERCENT_NOT_EMPTY]: "% Có dữ liệu",
    [AggregationType.SUM]: "Tổng",
    [AggregationType.AVERAGE]: "Trung bình",
    [AggregationType.MEDIAN]: "Trung vị",
    [AggregationType.MIN]: "Nhỏ nhất",
    [AggregationType.MAX]: "Lớn nhất",
    [AggregationType.RANGE]: "Khoảng",
  };

  // Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize column widths from properties
  useEffect(() => {
    const widths: Record<string, number> = {};
    board.properties.forEach((p) => {
      widths[p.id] = p.width || 150;
    });
    setColumnWidths(widths);
  }, [board.properties]);

  // Column resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    const startWidth = columnWidths[propertyId] || 150;
    setResizing({ id: propertyId, startX: e.clientX, startWidth });
  }, [columnWidths]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(80, Math.min(500, resizing.startWidth + diff));
      setColumnWidths((prev) => ({ ...prev, [resizing.id]: newWidth }));
    };

    const handleMouseUp = () => {
      if (resizing && onUpdatePropertyWidth) {
        onUpdatePropertyWidth(resizing.id, columnWidths[resizing.id] || 150);
      }
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, columnWidths, onUpdatePropertyWidth]);

  // Sort properties by order
  const sortedProperties = useMemo(() => {
    return [...board.properties].sort((a, b) => a.order - b.order);
  }, [board.properties]);

  // Filter visible properties if configured
  const visibleProperties = useMemo(() => {
    return view.config.visibleProperties
      ? sortedProperties.filter((p) => view.config.visibleProperties!.includes(p.id))
      : sortedProperties;
  }, [sortedProperties, view.config.visibleProperties]);

  const isTitleVisible = !view.config.visibleProperties || view.config.visibleProperties.includes("title");

  // Apply search, filters and sorts to tasks
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => {
        if (task.title.toLowerCase().includes(query)) return true;
        const taskProps = task.properties || {};
        for (const prop of board.properties) {
          if (prop.type === PropertyType.TEXT || prop.type === PropertyType.RICH_TEXT) {
            const value = taskProps[prop.id];
            if (value && String(value).toLowerCase().includes(query)) return true;
          }
        }
        return false;
      });
    }

    // Apply filters
    if (filters.length > 0) {
      result = result.filter(task =>
        filters.every(filter => matchesFilter(task, filter, board.properties))
      );
    }

    // Apply sorts
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const prop = board.properties.find(p => p.id === sort.propertyId);
          if (!prop) continue;

          const aVal = (a.properties || {})[sort.propertyId];
          const bVal = (b.properties || {})[sort.propertyId];
          const comparison = compareValues(aVal, bVal, prop.type);

          if (comparison !== 0) {
            return sort.direction === "asc" ? comparison : -comparison;
          }
        }
        return a.order - b.order;
      });
    } else {
      // Default sort by order
      result.sort((a, b) => a.order - b.order);
    }

    return result;
  }, [tasks, searchQuery, filters, sorts, board.properties]);

  // Group tasks logic
  const groupedTasks = useMemo(() => {
    if (!groupBy) return null;

    const property = board.properties.find(p => p.id === groupBy);
    if (!property) return null;

    const groups: { id: string; title: string; color?: string; tasks: TaskData[] }[] = [];
    const noValueTasks: TaskData[] = [];

    // Initialize groups based on property type
    if (property.type === PropertyType.SELECT || property.type === PropertyType.STATUS || property.type === PropertyType.MULTI_SELECT) {
      property.options?.forEach(opt => {
        groups.push({
          id: opt.id,
          title: opt.label,
          color: opt.color,
          tasks: []
        });
      });
    } else if (property.type === PropertyType.PERSON || property.type === PropertyType.USER) {
      users.forEach(user => {
        groups.push({
          id: user.id,
          title: user.name,
          tasks: []
        });
      });
    }

    // Distribute tasks
    processedTasks.forEach(task => {
      const value = (task.properties || {})[groupBy];

      if (!value) {
        noValueTasks.push(task);
        return;
      }

      if (Array.isArray(value)) {
        // Multi-select: task can be in multiple groups? Or just first one?
        // Usually grouping by multi-select duplicates the task or picks primary.
        // For simplicity, let's put in first matching group or no value.
        if (value.length === 0) {
          noValueTasks.push(task);
        } else {
          const firstVal = value[0];
          const group = groups.find(g => g.id === firstVal);
          if (group) {
            group.tasks.push(task);
          } else {
            noValueTasks.push(task);
          }
        }
      } else {
        const group = groups.find(g => g.id === String(value));
        if (group) {
          group.tasks.push(task);
        } else {
          noValueTasks.push(task);
        }
      }
    });

    // Add "No Value" group at the end
    if (noValueTasks.length > 0) {
      groups.push({
        id: "no_value",
        title: "Không có giá trị",
        tasks: noValueTasks
      });
    }

    // Filter out empty groups if desired, or keep them.
    // Usually we keep them to allow dragging into them (if we supported drag).
    return groups;
  }, [processedTasks, groupBy, board.properties, users]);

  // Flatten tasks for visual index calculation
  const visualTasks = useMemo(() => {
    if (groupedTasks) {
      const tasks: TaskData[] = [];
      groupedTasks.forEach(g => {
        if (expandedGroups[g.id] !== false) { // Default true
           tasks.push(...g.tasks);
        }
      });
      return tasks;
    }
    return processedTasks;
  }, [groupedTasks, processedTasks, expandedGroups]);

  // Fill Handle Logic
  const handleFillStart = (e: React.MouseEvent, taskId: string, propertyId: string, value: unknown, index: number) => {
    setFillRange({ start: index, end: index, propertyId, value });

    const handleMouseUp = () => {
      setFillRange(prev => {
        if (prev && prev.start !== prev.end) {
          // Apply changes
          const start = Math.min(prev.start, prev.end);
          const end = Math.max(prev.start, prev.end);

          // We need to find the tasks in this range
          // Since visualTasks is derived from state, we can use it
          // BUT we need to be careful about stale closures if we use visualTasks directly here?
          // Actually, setFillRange callback gives us the range.
          // We need the tasks.
          // Let's trigger an effect or just use the ref to tasks?
          // Or just dispatch the updates here if we have access to tasks.
          // We don't have access to the latest visualTasks inside this closure unless we use a ref or similar.
          // However, since we are adding the listener on mousedown, the closure captures the current render scope.
          // If visualTasks changes during drag (unlikely unless real-time update), it might be an issue.
          // For now, let's assume visualTasks is stable enough during a drag.
        }
        return null;
      });
      document.removeEventListener("mouseup", handleMouseUp);
      // document.removeEventListener("mousemove", handleMouseMove); // We use onMouseEnter on rows instead
    };

    document.addEventListener("mouseup", handleMouseUp);
  };

  // We need to apply the changes when fillRange becomes null (on mouse up)
  // But we can't do it inside the setState callback easily because we need side effects (API calls).
  // So let's use an effect that watches for the transition from non-null to null?
  // Or just handle it in the mouseup handler with a ref to visualTasks.
  const visualTasksRef = useRef(visualTasks);
  useEffect(() => {
    visualTasksRef.current = visualTasks;
  }, [visualTasks]);

  useEffect(() => {
    if (!fillRange) return;

    const handleMouseUp = () => {
      if (fillRange.start !== fillRange.end) {
        const start = Math.min(fillRange.start, fillRange.end);
        const end = Math.max(fillRange.start, fillRange.end);
        const tasksToUpdate = visualTasksRef.current.slice(start, end + 1);

        tasksToUpdate.forEach(task => {
            // Skip the source task if it's included (it is)
            // Actually we want to copy TO the range.
            // If dragging down: start is source.
            // If dragging up: end is source?
            // Excel logic: The source is the cell you started dragging FROM.
            // So we apply `fillRange.value` to all tasks in range.
            if (task.properties[fillRange.propertyId] !== fillRange.value) {
                onUpdateTask(task._id, {
                    properties: { ...task.properties, [fillRange.propertyId]: fillRange.value }
                });
            }
        });
      }
      setFillRange(null);
    };

    const onMouseUp = () => {
        handleMouseUp();
        document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [fillRange, onUpdateTask]); // Re-binds if fillRange changes, which happens on move. This is inefficient.

  // Better approach:
  // Keep fillRange in state.
  // On mouse up (global), read the current fillRange state and apply.
  // But global listener needs access to current state.

  // Let's refactor handleFillStart to NOT add the listener, but set a flag `isFilling`.
  // And have a global `useEffect` that handles the mouseup if `isFilling` is true.

  const [isFilling, setIsFilling] = useState(false);

  const onFillStartAction = (e: React.MouseEvent, taskId: string, propertyId: string, value: unknown, index: number) => {
      setIsFilling(true);
      setFillRange({ start: index, end: index, propertyId, value });
  };

  const onFillMoveAction = (index: number) => {
      if (isFilling && fillRange) {
          setFillRange({ ...fillRange, end: index });
      }
  };

  useEffect(() => {
      if (!isFilling) return;

      const handleMouseUp = () => {
          setIsFilling(false);
          if (fillRange && fillRange.start !== fillRange.end) {
              const start = Math.min(fillRange.start, fillRange.end);
              const end = Math.max(fillRange.start, fillRange.end);
              const tasksToUpdate = visualTasksRef.current.slice(start, end + 1);

              tasksToUpdate.forEach(task => {
                  // Don't update if value is same (optimization)
                  // Also skip the source task ideally, but updating it with same value is harmless
                  onUpdateTask(task._id, {
                      properties: { ...task.properties, [fillRange.propertyId]: fillRange.value }
                  });
              });
          }
          setFillRange(null);
      };

      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isFilling, fillRange, onUpdateTask]);


  // Initialize expanded state for new groups
  useEffect(() => {
    if (groupedTasks) {
      setExpandedGroups(prev => {
        const next = { ...prev };
        groupedTasks.forEach(g => {
          if (next[g.id] === undefined) {
            next[g.id] = true; // Default expanded
          }
        });
        return next;
      });
    }
  }, [groupedTasks]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === processedTasks.length && processedTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(processedTasks.map(t => t._id)));
    }
  };

  const handleToggleSelect = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const startAddingTask = () => {
    onCreateTask("");
  };

  // Drag End Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "COLUMN" && onReorderProperties) {
      const oldIndex = sortedProperties.findIndex((p) => p.id === active.id);
      const newIndex = sortedProperties.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderProperties(oldIndex, newIndex);
      }
    } else if (activeData?.type === "TASK" && onReorderTasks) {
      const oldIndex = processedTasks.findIndex((t) => t._id === active.id);
      const newIndex = processedTasks.findIndex((t) => t._id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderTasks(oldIndex, newIndex);
      }
    }
  };

  // Disable row drag if sorted or filtered OR grouped
  const isRowDragEnabled = !searchQuery && filters.length === 0 && sorts.length === 0 && !groupBy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full border-collapse text-sm min-w-max">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b">
                <th className="w-8 bg-background border-r p-0 sticky left-0 z-30">
                    <div className="flex items-center justify-center h-full w-full">
                        <input
                            type="checkbox"
                            checked={processedTasks.length > 0 && selectedTaskIds.size === processedTasks.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                    </div>
                </th>
                <th className="w-8 bg-background sticky left-8 z-30 border-r" />
                {isTitleVisible && (
                  <th className="text-left font-medium text-muted-foreground py-2 px-3 min-w-[200px] bg-background sticky left-16 z-30 border-r">
                    Tiêu đề
                  </th>
                )}
                <SortableContext
                  items={visibleProperties.map(p => p.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {visibleProperties.map((property, index) => (
                    <SortableHeader
                      key={property.id}
                      property={property}
                      width={columnWidths[property.id] || 150}
                      index={index}
                      onResize={handleMouseDown}
                      onRemove={onRemoveProperty}
                      onRename={onRenameProperty}
                      onAddAt={onAddPropertyAt}
                    />
                  ))}
                </SortableContext>
                <th className="w-10 bg-background" />
              </tr>
            </thead>

            <tbody>
              {groupedTasks ? (
                // Grouped View
                groupedTasks.map(group => {
                  // Calculate starting index for this group
                  // We need to know how many tasks were in previous groups
                  // This is expensive to calculate in render loop if we don't have it pre-calculated.
                  // But we can use the task ID to find index in visualTasks?
                  // Or just map visualTasks and render?
                  // But we need the headers.

                  // Let's use a running index counter? No, React render must be pure.
                  // We can pre-calculate group start indices.
                  return (
                  <>
                    <GroupHeader
                      key={group.id}
                      title={group.title}
                      count={group.tasks.length}
                      color={group.color}
                      isExpanded={!!expandedGroups[group.id]}
                      onToggle={() => toggleGroup(group.id)}
                      colSpan={visibleProperties.length + (isTitleVisible ? 4 : 3)}
                    />
                    {expandedGroups[group.id] && (
                      <SortableContext
                        items={group.tasks.map(t => t._id)}
                        strategy={verticalListSortingStrategy}
                        disabled={true} // Disable drag in grouped view for now
                      >
                        {group.tasks.map((task) => {
                           // Find index in visualTasks
                           // This is O(N*M) where N is total tasks and M is group tasks.
                           // Optimization: Create a map of taskId -> index
                           const vIndex = visualTasks.findIndex(t => t._id === task._id);

                           return (
                          <SortableRow
                            key={task._id}
                            task={task}
                            visibleProperties={visibleProperties}
                            columnWidths={columnWidths}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            users={users}
                            onAddPropertyOption={onAddPropertyOption}
                            isDragEnabled={false}
                            isSelected={selectedTaskIds.has(task._id)}
                            onToggleSelect={handleToggleSelect}
                            visualIndex={vIndex}
                            onFillStart={onFillStartAction}
                            onFillMove={onFillMoveAction}
                            fillRange={fillRange}
                            isTitleVisible={isTitleVisible}
                          />
                        )})}
                      </SortableContext>
                    )}
                  </>
                )})
              ) : (
                // Flat View
                <SortableContext
                  items={processedTasks.map(t => t._id)}
                  strategy={verticalListSortingStrategy}
                  disabled={!isRowDragEnabled}
                >
                  {processedTasks.map((task, index) => (
                    <SortableRow
                      key={task._id}
                      task={task}
                      visibleProperties={visibleProperties}
                      columnWidths={columnWidths}
                      onUpdateTask={onUpdateTask}
                      onDeleteTask={onDeleteTask}
                      users={users}
                      onAddPropertyOption={onAddPropertyOption}
                      isDragEnabled={isRowDragEnabled}
                      isSelected={selectedTaskIds.has(task._id)}
                      onToggleSelect={handleToggleSelect}
                      visualIndex={index}
                      onFillStart={onFillStartAction}
                      onFillMove={onFillMoveAction}
                      fillRange={fillRange}
                      isTitleVisible={isTitleVisible}
                    />
                  ))}
                </SortableContext>
              )}

              <tr className="border-b">
                <td className="w-8 border-r bg-background sticky left-0 z-20" />
                <td className="w-8 border-r bg-background sticky left-8 z-20" />
                {isTitleVisible ? (
                  <>
                    <td className="py-1 px-3 sticky left-16 z-20 bg-background border-r">
                      <button
                        onClick={startAddingTask}
                        className="flex items-center gap-1.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Thêm mới</span>
                      </button>
                    </td>
                    <td colSpan={visibleProperties.length} className="bg-background" />
                  </>
                ) : (
                  <td colSpan={visibleProperties.length} className="py-1 px-3">
                    <button
                      onClick={startAddingTask}
                      className="flex items-center gap-1.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Thêm mới</span>
                    </button>
                  </td>
                )}
              </tr>
            </tbody>
            <tfoot className="sticky bottom-0 bg-background z-10 border-t shadow-sm">
              <tr>
                <td className="w-8 border-r sticky left-0 bg-background z-20" />
                <td className="w-8 border-r sticky left-8 bg-background z-20" />
                {isTitleVisible && (
                  <td className="py-2 px-3 border-r font-medium text-muted-foreground text-right sticky left-16 bg-background z-20">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs uppercase">Đếm:</span>
                      <span>{processedTasks.length}</span>
                    </div>
                  </td>
                )}
                {visibleProperties.map((property) => {
                  const aggregation = view.config.aggregations?.find(a => a.propertyId === property.id);
                  const value = aggregation ? calculateAggregation(processedTasks, property, aggregation.type) : null;

                  return (
                    <td key={property.id} className="py-2 px-3 border-r">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full text-right text-xs text-muted-foreground hover:text-foreground truncate h-full min-h-[20px] flex items-center justify-end">
                            {aggregation ? (
                              <span className="font-medium">
                                {value}
                              </span>
                            ) : (
                              <span className="opacity-0 hover:opacity-50">Tính toán</span>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Tính toán</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, null)}>
                            Không
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.COUNT)}>
                            Đếm tất cả
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.COUNT_EMPTY)}>
                            Đếm trống
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.COUNT_NOT_EMPTY)}>
                            Đếm có dữ liệu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.PERCENT_EMPTY)}>
                            % Trống
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.PERCENT_NOT_EMPTY)}>
                            % Có dữ liệu
                          </DropdownMenuItem>

                          {(property.type === PropertyType.NUMBER || property.type === PropertyType.CURRENCY) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.SUM)}>
                                Tổng
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.AVERAGE)}>
                                Trung bình
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.MIN)}>
                                Nhỏ nhất
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.MAX)}>
                                Lớn nhất
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.MEDIAN)}>
                                Trung vị
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateAggregation?.(property.id, AggregationType.RANGE)}>
                                Khoảng
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  );
                })}
                <td className="w-10" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Card View - No Drag Drop for now */}
        <div className="md:hidden flex-1 overflow-y-auto">
          <div className="divide-y">
            {processedTasks.map((task) => (
              <div key={task._id} className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.has(task._id)}
                    onChange={() => handleToggleSelect(task._id)}
                    className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <button className="cursor-grab p-1 text-muted-foreground hover:text-foreground mt-0.5">
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => onUpdateTask(task._id, { title: e.target.value })}
                    className="flex-1 font-medium bg-transparent border-none outline-none focus:ring-0"
                    placeholder="Untitled"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDeleteTask(task._id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2 pl-7">
                  {visibleProperties.slice(0, 6).map((property) => {
                    const taskProps = task.properties || {};
                    return (
                      <div key={property.id} className="space-y-0.5">
                        <label className="text-xs text-muted-foreground truncate block">
                          {property.name}
                        </label>
                        <PropertyCell
                          property={property}
                          value={taskProps[property.id]}
                          onChange={(value) =>
                            onUpdateTask(task._id, {
                              properties: { ...taskProps, [property.id]: value },
                            })
                          }
                          onAddOption={onAddPropertyOption}
                          users={users}
                          compact
                        />
                      </div>
                    );
                  })}
                </div>

                {visibleProperties.length > 6 && (
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pl-7">
                    <span>+{visibleProperties.length - 6} thuộc tính khác</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            <div className="p-4">
              <button
                onClick={startAddingTask}
                className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {processedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-2">
              {filters.length > 0 || searchQuery ? "Không tìm thấy kết quả" : "Chưa có hồ sơ nào"}
            </p>
            {!filters.length && !searchQuery && (
              <button onClick={startAddingTask} className="text-primary hover:underline">
                Thêm hồ sơ đầu tiên
              </button>
            )}
          </div>
        )}

        {selectedTaskIds.size > 0 && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-4 z-50">
            <span className="text-sm font-medium">{selectedTaskIds.size} đã chọn</span>
            <div className="h-4 w-[1px] bg-background/20" />
            <button
              onClick={() => {
                if (onBulkDeleteTasks) {
                  onBulkDeleteTasks(Array.from(selectedTaskIds));
                  setSelectedTaskIds(new Set());
                }
              }}
              className="text-sm font-medium hover:text-red-400 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </button>
            <button
                onClick={() => setSelectedTaskIds(new Set())}
                className="ml-2 p-1 hover:bg-background/20 rounded-full"
            >
                <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
}
