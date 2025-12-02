"use client";

import { useState, useCallback } from "react";
import { BoardHeader } from "@/components/boards/board-header";
import { BoardToolbar } from "@/components/boards/board-toolbar";
import { TableView } from "@/components/boards/views/table-view";
import {
  type Board,
  type Task,
  type Property,
  type SortConfig,
  type FilterConfig,
  ViewType
} from "@/types/board";

interface BoardData extends Omit<Board, "createdAt" | "updatedAt"> {
  _id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  tasks: TaskData[];
}

interface TaskData extends Omit<Task, "createdAt" | "updatedAt"> {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface BoardDetailClientProps {
  initialBoard: BoardData;
}

export function BoardDetailClient({ initialBoard }: BoardDetailClientProps) {
  const [board, setBoard] = useState(initialBoard);
  const [tasks, setTasks] = useState(initialBoard.tasks);
  const [activeViewId, setActiveViewId] = useState(
    board.views.find((v) => v.isDefault)?.id || board.views[0]?.id
  );

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sorts, setSorts] = useState<SortConfig[]>([]);

  const activeView = board.views.find((v) => v.id === activeViewId);

  // Update board
  const handleUpdateBoard = useCallback(
    async (updates: Partial<BoardData>) => {
      try {
        const res = await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          setBoard((prev) => ({ ...prev, ...updated }));
        }
      } catch (error) {
        console.error("Failed to update board:", error);
      }
    },
    [board._id]
  );

  // Add property
  const handleAddProperty = useCallback(
    async (property: Omit<Property, "id" | "order">) => {
      const newProperty: Property = {
        ...property,
        id: crypto.randomUUID(),
        order: board.properties.length,
      };

      try {
        const res = await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: [...board.properties, newProperty],
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setBoard((prev) => ({ ...prev, ...updated }));
        }
      } catch (error) {
        console.error("Failed to add property:", error);
      }
    },
    [board._id, board.properties]
  );

  // Remove property
  const handleRemoveProperty = useCallback(
    async (propertyId: string) => {
      try {
        const res = await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: board.properties.filter((p) => p.id !== propertyId),
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setBoard((prev) => ({ ...prev, ...updated }));
        }
      } catch (error) {
        console.error("Failed to remove property:", error);
      }
    },
    [board._id, board.properties]
  );

  // Add option to select/multi-select/status property
  const handleAddPropertyOption = useCallback(
    async (propertyId: string, option: { id: string; label: string; color?: string }) => {
      const property = board.properties.find((p) => p.id === propertyId);
      if (!property) return;

      const updatedProperty = {
        ...property,
        options: [...(property.options || []), option],
      };

      const updatedProperties = board.properties.map((p) =>
        p.id === propertyId ? updatedProperty : p
      );

      // Optimistic update
      setBoard((prev) => ({ ...prev, properties: updatedProperties }));

      try {
        const res = await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ properties: updatedProperties }),
        });
        if (res.ok) {
          const updated = await res.json();
          setBoard((prev) => ({ ...prev, ...updated }));
        }
      } catch (error) {
        console.error("Failed to add property option:", error);
        // Revert on error
        setBoard((prev) => ({ ...prev, properties: board.properties }));
      }
    },
    [board._id, board.properties]
  );

  // Filter handlers
  const handleAddFilter = useCallback((filter: FilterConfig) => {
    setFilters((prev) => [...prev, filter]);
  }, []);

  const handleRemoveFilter = useCallback((index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  // Sort handlers
  const handleAddSort = useCallback((sort: SortConfig) => {
    setSorts((prev) => {
      // Replace if same property, otherwise add
      const existing = prev.findIndex((s) => s.propertyId === sort.propertyId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = sort;
        return updated;
      }
      return [...prev, sort];
    });
  }, []);

  const handleRemoveSort = useCallback((index: number) => {
    setSorts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearSorts = useCallback(() => {
    setSorts([]);
  }, []);

  // Create new task
  const handleCreateTask = useCallback(
    async (title: string) => {
      try {
        const res = await fetch(`/api/boards/${board._id}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, properties: {} }),
        });
        if (res.ok) {
          const newTask = await res.json();
          setTasks((prev) => [...prev, newTask]);
          return newTask;
        }
      } catch (error) {
        console.error("Failed to create task:", error);
      }
      return null;
    },
    [board._id]
  );

  // Update task
  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<TaskData>) => {
      // Optimistic update - merge properties correctly
      setTasks((prev) =>
        prev.map((t) => {
          if (t._id !== taskId) return t;

          // If updating properties, merge with existing
          if (updates.properties) {
            return {
              ...t,
              ...updates,
              properties: {
                ...(t.properties || {}),
                ...updates.properties,
              },
            };
          }
          return { ...t, ...updates };
        })
      );

      try {
        const res = await fetch(`/api/boards/${board._id}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          // Update with server response to ensure consistency
          const updatedTask = await res.json();
          setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? { ...t, ...updatedTask } : t))
          );
        } else {
          // Revert on error
          setTasks(initialBoard.tasks);
        }
      } catch (error) {
        console.error("Failed to update task:", error);
        setTasks(initialBoard.tasks);
      }
    },
    [board._id, initialBoard.tasks]
  );

  // Delete task
  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        const res = await fetch(`/api/boards/${board._id}/tasks/${taskId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setTasks((prev) => prev.filter((t) => t._id !== taskId));
        }
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    },
    [board._id]
  );

  return (
    <div className="flex flex-col h-screen">
      <BoardHeader
        board={board}
        activeView={activeView}
        views={board.views}
        onViewChange={setActiveViewId}
        onUpdateBoard={handleUpdateBoard}
      />

      <BoardToolbar
        properties={board.properties}
        filters={filters}
        sorts={sorts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddProperty={handleAddProperty}
        onRemoveProperty={handleRemoveProperty}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
        onAddSort={handleAddSort}
        onRemoveSort={handleRemoveSort}
        onClearSorts={handleClearSorts}
      />

      <div className="flex-1 overflow-auto">
        {activeView?.type === ViewType.TABLE && (
          <TableView
            board={board}
            tasks={tasks}
            view={activeView}
            searchQuery={searchQuery}
            filters={filters}
            sorts={sorts}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onRemoveProperty={handleRemoveProperty}
            onAddPropertyOption={handleAddPropertyOption}
          />
        )}

        {activeView?.type === ViewType.KANBAN && (
          <div className="p-6 text-muted-foreground">
            Kanban view - Coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
