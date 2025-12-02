"use client";

import { useState, useRef } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { PropertyCell } from "./property-cell";
import { type Board, type Task, type View, type Property } from "@/types/board";

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
  onCreateTask: (title: string) => Promise<TaskData | null>;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TableView({
  board,
  tasks,
  view,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: TableViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort properties by order
  const sortedProperties = [...board.properties].sort((a, b) => a.order - b.order);

  // Filter visible properties if configured
  const visibleProperties = view.config.visibleProperties
    ? sortedProperties.filter((p) => view.config.visibleProperties!.includes(p.id))
    : sortedProperties;

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
    <div className="min-w-full">
      {/* Table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="w-8" />
            <th className="text-left font-medium text-muted-foreground py-2 px-3 min-w-[200px]">
              Tiêu đề
            </th>
            {visibleProperties.map((property) => (
              <th
                key={property.id}
                className="text-left font-medium text-muted-foreground py-2 px-3 min-w-[150px]"
                style={{ width: property.width || 150 }}
              >
                {property.name}
              </th>
            ))}
            <th className="w-10" />
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task._id}
              className="border-b hover:bg-accent/30 transition-colors group"
              onMouseEnter={() => setHoveredRow(task._id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Drag handle */}
              <td className="w-8 text-center">
                <button className="opacity-0 group-hover:opacity-100 cursor-grab p-1 text-muted-foreground hover:text-foreground transition-opacity">
                  <GripVertical className="h-4 w-4" />
                </button>
              </td>

              {/* Title */}
              <td className="py-1 px-3">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) =>
                    onUpdateTask(task._id, { title: e.target.value })
                  }
                  className="w-full bg-transparent border-none outline-none py-1.5 px-0 focus:ring-0"
                  placeholder="Untitled"
                />
              </td>

              {/* Property cells */}
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

              {/* Actions */}
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

          {/* Add new row */}
          <tr className="border-b">
            <td className="w-8" /><td colSpan={visibleProperties.length + 2} className="py-1 px-3">
              {isAddingTask ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onBlur={() => {
                    if (!newTaskTitle.trim()) {
                      setIsAddingTask(false);
                    }
                  }}
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

      {/* Empty state */}
      {tasks.length === 0 && !isAddingTask && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-2">Chưa có hồ sơ nào</p>
          <button
            onClick={startAddingTask}
            className="text-primary hover:underline"
          >
            Thêm hồ sơ đầu tiên
          </button>
        </div>
      )}
    </div>
  );
}
