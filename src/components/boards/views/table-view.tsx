"use client";

import { useState, useRef, useMemo } from "react";
import { Plus, GripVertical, Trash2, MoreHorizontal, ChevronRight } from "lucide-react";
import { PropertyCell } from "./property-cell";
import {
  type Property,
  type View,
  type SortConfig,
  type FilterConfig,
  PropertyType
} from "@/types/board";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskData {
  _id: string;
  title: string;
  properties: Record<string, unknown>;
  order: number;
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
  onCreateTask: (title: string) => Promise<TaskData | null>;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => void;
  onDeleteTask: (taskId: string) => void;
  onRemoveProperty?: (propertyId: string) => void;
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
      return new Date(String(a)).getTime() - new Date(String(b)).getTime();
    case PropertyType.CHECKBOX:
      return (a ? 1 : 0) - (b ? 1 : 0);
    default:
      return String(a).localeCompare(String(b));
  }
}

// Helper to check if task matches filter
function matchesFilter(task: TaskData, filter: FilterConfig, properties: Property[]): boolean {
  const value = task.properties[filter.propertyId];

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

export function TableView({
  board,
  tasks,
  view,
  searchQuery = "",
  filters = [],
  sorts = [],
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onRemoveProperty,
}: TableViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort properties by order
  const sortedProperties = [...board.properties].sort((a, b) => a.order - b.order);

  // Filter visible properties if configured
  const visibleProperties = view.config.visibleProperties
    ? sortedProperties.filter((p) => view.config.visibleProperties!.includes(p.id))
    : sortedProperties;

  // Apply search, filters and sorts to tasks
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => {
        if (task.title.toLowerCase().includes(query)) return true;
        for (const prop of board.properties) {
          if (prop.type === PropertyType.TEXT || prop.type === PropertyType.RICH_TEXT) {
            const value = task.properties[prop.id];
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

          const aVal = a.properties[sort.propertyId];
          const bVal = b.properties[sort.propertyId];
          const comparison = compareValues(aVal, bVal, prop.type);

          if (comparison !== 0) {
            return sort.direction === "asc" ? comparison : -comparison;
          }
        }
        return a.order - b.order;
      });
    }

    return result;
  }, [tasks, searchQuery, filters, sorts, board.properties]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const result = await onCreateTask(newTaskTitle.trim());
    if (result) {
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    } else if (e.key === "Escape") {
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  const startAddingTask = () => {
    setIsAddingTask(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="w-full border-collapse text-sm min-w-max">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b">
              <th className="w-8 bg-background" />
              <th className="text-left font-medium text-muted-foreground py-2 px-3 min-w-[200px] bg-background sticky left-0 z-20 border-r">
                Tiêu đề
              </th>
              {visibleProperties.map((property) => (
                <th
                  key={property.id}
                  className="text-left font-medium text-muted-foreground py-2 px-3 min-w-[120px] bg-background"
                  style={{ width: property.width || 150 }}
                >
                  <div className="flex items-center justify-between group">
                    <span className="truncate">{property.name}</span>
                    {onRemoveProperty && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-accent rounded transition-opacity">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onRemoveProperty(property.id)}
                            className="text-destructive"
                          >
                            Xóa cột
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10 bg-background" />
            </tr>
          </thead>

          <tbody>
            {processedTasks.map((task) => (
              <tr key={task._id} className="border-b hover:bg-accent/30 transition-colors group">
                <td className="w-8 text-center">
                  <button className="opacity-0 group-hover:opacity-100 cursor-grab p-1 text-muted-foreground hover:text-foreground transition-opacity">
                    <GripVertical className="h-4 w-4" />
                  </button>
                </td>
                <td className="py-1 px-3 sticky left-0 bg-background border-r z-10 group-hover:bg-accent/30">
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => onUpdateTask(task._id, { title: e.target.value })}
                    className="w-full bg-transparent border-none outline-none py-1.5 px-0 focus:ring-0"
                    placeholder="Untitled"
                  />
                </td>
                {visibleProperties.map((property) => (
                  <td key={property.id} className="py-1 px-3">
                    <PropertyCell
                      property={property}
                      value={task.properties[property.id]}
                      onChange={(value) =>
                        onUpdateTask(task._id, {
                          properties: { ...task.properties, [property.id]: value },
                        })
                      }
                    />
                  </td>
                ))}
                <td className="w-10 text-center">
                  <button
                    onClick={() => onDeleteTask(task._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}

            <tr className="border-b">
              <td className="w-8" /><td colSpan={visibleProperties.length + 2} className="py-1 px-3">
                {isAddingTask ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onBlur={() => { if (!newTaskTitle.trim()) setIsAddingTask(false); }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none outline-none py-1.5 px-0 focus:ring-0"
                    placeholder="Nhập tiêu đề..."
                  />
                ) : (
                  <button
                    onClick={startAddingTask}
                    className="flex items-center gap-1.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm mới</span>
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="divide-y">
          {processedTasks.map((task) => (
            <div key={task._id} className="p-4 space-y-3">
              <div className="flex items-start gap-2">
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
                {visibleProperties.slice(0, 6).map((property) => (
                  <div key={property.id} className="space-y-0.5">
                    <label className="text-xs text-muted-foreground truncate block">
                      {property.name}
                    </label>
                    <PropertyCell
                      property={property}
                      value={task.properties[property.id]}
                      onChange={(value) =>
                        onUpdateTask(task._id, {
                          properties: { ...task.properties, [property.id]: value },
                        })
                      }
                      compact
                    />
                  </div>
                ))}
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
            {isAddingTask ? (
              <input
                ref={inputRef}
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onBlur={() => { if (!newTaskTitle.trim()) setIsAddingTask(false); }}
                onKeyDown={handleKeyDown}
                className="flex-1 w-full bg-transparent border-none outline-none py-2 focus:ring-0"
                placeholder="Nhập tiêu đề..."
                autoFocus
              />
            ) : (
              <button
                onClick={startAddingTask}
                className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {processedTasks.length === 0 && !isAddingTask && (
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
    </div>
  );
}
