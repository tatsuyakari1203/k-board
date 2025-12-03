"use client";

import { useState, useCallback, useEffect } from "react";
import { BoardHeader } from "@/components/boards/board-header";
import { BoardToolbar } from "@/components/boards/board-toolbar";
import { TableView } from "@/components/boards/views/table-view";
import { AddPropertyDialog } from "@/components/boards/add-property-dialog";
import { arrayMove } from "@dnd-kit/sortable";
import {
  type Board,
  type Task,
  type Property,
  type SortConfig,
  type FilterConfig,
  ViewType,
  AggregationType,
} from "@/types/board";
import { type BoardRole, type BoardPermissions } from "@/types/board-member";

interface BoardData extends Omit<Board, "createdAt" | "updatedAt"> {
  _id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  tasks: TaskData[];
  userRole?: BoardRole;
  userPermissions?: BoardPermissions;
}

interface TaskData extends Omit<Task, "createdAt" | "updatedAt"> {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface BoardDetailClientProps {
  initialBoard: BoardData;
}

export function BoardDetailClient({ initialBoard }: BoardDetailClientProps) {
  const [board, setBoard] = useState(initialBoard);
  // Ensure tasks are sorted by order initially
  const [tasks, setTasks] = useState(() =>
    [...initialBoard.tasks].sort((a, b) => a.order - b.order)
  );
  const [users, setUsers] = useState<UserOption[]>([]);
  const [activeViewId, setActiveViewId] = useState(
    board.views.find((v) => v.isDefault)?.id || board.views[0]?.id
  );

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sorts, setSorts] = useState<SortConfig[]>([]);

  // Add Property Dialog State
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [addPropertyIndex, setAddPropertyIndex] = useState<number | null>(null);

  const activeView = board.views.find((v) => v.id === activeViewId);

  // Fetch users for assignment
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Failed to fetch users:", err));
  }, []);

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
      // Calculate order based on insertion index or append to end
      let newOrder = board.properties.length;
      let updatedProperties = [...board.properties];

      if (addPropertyIndex !== null) {
        newOrder = addPropertyIndex;
        // Shift existing properties
        updatedProperties = updatedProperties.map(p => ({
          ...p,
          order: p.order >= newOrder ? p.order + 1 : p.order
        }));
      }

      const newProperty: Property = {
        ...property,
        id: crypto.randomUUID(),
        order: newOrder,
      };

      updatedProperties.push(newProperty);

      // Ensure properties are sorted by order
      updatedProperties.sort((a, b) => a.order - b.order);

      // Optimistic update
      setBoard((prev) => ({ ...prev, properties: updatedProperties }));

      try {
        const res = await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: updatedProperties,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setBoard((prev) => ({ ...prev, ...updated }));
        }
      } catch (error) {
        console.error("Failed to add property:", error);
        // Revert on error (simplified)
        setBoard((prev) => ({ ...prev, properties: board.properties }));
      } finally {
        setAddPropertyIndex(null);
      }
    },
    [board._id, board.properties, addPropertyIndex]
  );

  // Open Add Property Dialog
  const handleOpenAddProperty = useCallback((index?: number) => {
    setAddPropertyIndex(typeof index === "number" ? index : null);
    setIsAddPropertyOpen(true);
  }, []);

  // Rename property
  const handleRenameProperty = useCallback(
    async (propertyId: string, newName: string) => {
      const updatedProperties = board.properties.map((p) =>
        p.id === propertyId ? { ...p, name: newName } : p
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
        console.error("Failed to rename property:", error);
        setBoard((prev) => ({ ...prev, properties: board.properties }));
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

  // Update property width (column resize)
  const handleUpdatePropertyWidth = useCallback(
    async (propertyId: string, width: number) => {
      const updatedProperties = board.properties.map((p) =>
        p.id === propertyId ? { ...p, width } : p
      );

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
        console.error("Failed to update property width:", error);
      }
    },
    [board._id, board.properties]
  );

  // Reorder properties
  const handleReorderProperties = useCallback(
    async (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      // Sort properties by order first to ensure we are moving the right indices
      const sortedProperties = [...board.properties].sort((a, b) => a.order - b.order);

      const newProperties = arrayMove(sortedProperties, oldIndex, newIndex).map((p, index) => ({
        ...p,
        order: index,
      }));

      // Optimistic update
      setBoard((prev) => ({ ...prev, properties: newProperties }));

      try {
        await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ properties: newProperties }),
        });
      } catch (error) {
        console.error("Failed to reorder properties:", error);
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

  // Group By handler
  const handleGroupByChange = useCallback(
    async (propertyId: string | undefined) => {
      if (!activeView) return;

      const updatedView = {
        ...activeView,
        config: {
          ...activeView.config,
          groupBy: propertyId,
        },
      };

      const updatedViews = board.views.map(v => v.id === activeView.id ? updatedView : v);

      // Optimistic update
      setBoard(prev => ({ ...prev, views: updatedViews }));

      try {
        await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ views: updatedViews }),
        });
      } catch (error) {
        console.error("Failed to update group by:", error);
      }
    },
    [board._id, board.views, activeView]
  );

  // Toggle column visibility
  const handleToggleColumnVisibility = useCallback(
    async (propertyId: string) => {
      if (!activeView) return;

      const currentVisible = activeView.config.visibleProperties || board.properties.map(p => p.id);
      let newVisible;

      if (currentVisible.includes(propertyId)) {
        newVisible = currentVisible.filter(id => id !== propertyId);
      } else {
        newVisible = [...currentVisible, propertyId];
      }

      const updatedView = {
        ...activeView,
        config: {
          ...activeView.config,
          visibleProperties: newVisible,
        },
      };

      const updatedViews = board.views.map(v => v.id === activeView.id ? updatedView : v);

      // Optimistic update
      setBoard(prev => ({ ...prev, views: updatedViews }));

      try {
        await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ views: updatedViews }),
        });
      } catch (error) {
        console.error("Failed to update column visibility:", error);
      }
    },
    [board._id, board.views, activeView, board.properties]
  );

  // Update aggregation
  const handleUpdateAggregation = useCallback(
    async (propertyId: string, type: AggregationType | null) => {
      if (!activeView) return;

      const currentAggregations = activeView.config.aggregations || [];
      let newAggregations;

      if (type === null) {
        // Remove aggregation
        newAggregations = currentAggregations.filter(a => a.propertyId !== propertyId);
      } else {
        // Add or update aggregation
        const existingIndex = currentAggregations.findIndex(a => a.propertyId === propertyId);
        if (existingIndex >= 0) {
          newAggregations = [...currentAggregations];
          newAggregations[existingIndex] = { propertyId, type };
        } else {
          newAggregations = [...currentAggregations, { propertyId, type }];
        }
      }

      const updatedView = {
        ...activeView,
        config: {
          ...activeView.config,
          aggregations: newAggregations,
        },
      };

      const updatedViews = board.views.map(v => v.id === activeView.id ? updatedView : v);

      // Optimistic update
      setBoard(prev => ({ ...prev, views: updatedViews }));

      try {
        await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ views: updatedViews }),
        });
      } catch (error) {
        console.error("Failed to update aggregation:", error);
      }
    },
    [board._id, board.views, activeView]
  );

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

  // Reorder tasks
  const handleReorderTasks = useCallback(
    async (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      // Ensure we are working with sorted tasks
      const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

      const newTasks = arrayMove(sortedTasks, oldIndex, newIndex).map((t, index) => ({
        ...t,
        order: index,
      }));

      setTasks(newTasks);

      try {
        await fetch(`/api/boards/${board._id}/tasks/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds: newTasks.map((t) => t._id) }),
        });
      } catch (error) {
        console.error("Failed to reorder tasks:", error);
      }
    },
    [board._id, tasks]
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

  // Bulk delete tasks
  const handleBulkDeleteTasks = useCallback(
    async (taskIds: string[]) => {
      // Optimistic update
      setTasks((prev) => prev.filter((t) => !taskIds.includes(t._id)));

      try {
        // We can either call delete API for each task or create a bulk delete API
        // For now, let's call delete for each task in parallel
        await Promise.all(
          taskIds.map((id) =>
            fetch(`/api/boards/${board._id}/tasks/${id}`, {
              method: "DELETE",
            })
          )
        );
      } catch (error) {
        console.error("Failed to bulk delete tasks:", error);
        // Revert on error (simplified - would need to refetch tasks)
        setTasks(initialBoard.tasks);
      }
    },
    [board._id, initialBoard.tasks]
  );

  return (
    <div className="flex flex-col h-screen">
      <BoardHeader
        board={board}
        activeView={activeView}
        views={board.views}
        onViewChange={setActiveViewId}
        onUpdateBoard={handleUpdateBoard}
        userRole={board.userRole}
        userPermissions={board.userPermissions}
      />

      <BoardToolbar
        properties={board.properties}
        filters={filters}
        sorts={sorts}
        groupBy={activeView?.config.groupBy}
        visibleProperties={activeView?.config.visibleProperties}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPropertyClick={() => handleOpenAddProperty()}
        onRemoveProperty={handleRemoveProperty}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
        onAddSort={handleAddSort}
        onRemoveSort={handleRemoveSort}
        onClearSorts={handleClearSorts}
        onGroupByChange={handleGroupByChange}
        onToggleColumnVisibility={handleToggleColumnVisibility}
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
            users={users}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onRemoveProperty={handleRemoveProperty}
            onAddPropertyOption={handleAddPropertyOption}
            onUpdatePropertyWidth={handleUpdatePropertyWidth}
            onReorderTasks={handleReorderTasks}
            onReorderProperties={handleReorderProperties}
            onRenameProperty={handleRenameProperty}
            onAddPropertyAt={handleOpenAddProperty}
            onUpdateAggregation={handleUpdateAggregation}
            onBulkDeleteTasks={handleBulkDeleteTasks}
          />
        )}

        {activeView?.type === ViewType.KANBAN && (
          <div className="p-6 text-muted-foreground">
            Kanban view - Coming soon...
          </div>
        )}
      </div>

      <AddPropertyDialog
        open={isAddPropertyOpen}
        onOpenChange={setIsAddPropertyOpen}
        onSubmit={handleAddProperty}
      />
    </div>
  );
}
