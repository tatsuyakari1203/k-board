"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
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
  DropdownMenuSeparator,
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
  const taskProps = task.properties || {};
  const value = taskProps[filter.propertyId];

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
      <div className="flex items-center justify-between" {...attributes} {...listeners}>
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
          />
        ) : (
          <span className="truncate cursor-grab active:cursor-grabbing select-none">{property.name}</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-accent rounded transition-opacity">
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
  isDragEnabled
}: {
  task: TaskData;
  visibleProperties: Property[];
  columnWidths: Record<string, number>;
  onUpdateTask: (id: string, updates: Partial<TaskData>) => void;
  onDeleteTask: (id: string) => void;
  users?: UserOption[];
  onAddPropertyOption?: (id: string, option: any) => void;
  isDragEnabled: boolean;
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
      className="border-b hover:bg-accent/30 transition-colors group"
    >
      <td className="w-8 text-center">
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
      <td className="py-1 px-3 sticky left-0 bg-background border-r z-10 group-hover:bg-accent/30">
        <input
          type="text"
          value={task.title}
          onChange={(e) => onUpdateTask(task._id, { title: e.target.value })}
          className="w-full bg-transparent border-none outline-none py-1.5 px-0 focus:ring-0"
          placeholder="Untitled"
        />
      </td>
      {visibleProperties.map((property) => {
        const taskProps = task.properties || {};
        return (
          <td
            key={property.id}
            className="py-1 px-3"
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
}: TableViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ id: string; startX: number; startWidth: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Disable row drag if sorted or filtered
  const isRowDragEnabled = !searchQuery && filters.length === 0 && sorts.length === 0;

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
                <th className="w-8 bg-background" />
                <th className="text-left font-medium text-muted-foreground py-2 px-3 min-w-[200px] bg-background sticky left-0 z-20 border-r">
                  Tiêu đề
                </th>
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
              <SortableContext
                items={processedTasks.map(t => t._id)}
                strategy={verticalListSortingStrategy}
                disabled={!isRowDragEnabled}
              >
                {processedTasks.map((task) => (
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
                  />
                ))}
              </SortableContext>

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

        {/* Mobile Card View - No Drag Drop for now */}
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
    </DndContext>
  );
}
