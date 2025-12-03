"use client";

import { useState, useCallback, useEffect } from "react";
import { BoardHeader } from "@/components/boards/board-header";
import { BoardToolbar } from "@/components/boards/board-toolbar";
import { TableView } from "@/components/boards/views/table-view";
import { KanbanView } from "@/components/boards/views/kanban-view";
import { AddPropertyDialog } from "@/components/boards/add-property-dialog";
import {
  type Board,
  type Property,
  type SortConfig,
  type FilterConfig,
  ViewType,
} from "@/types/board";
import { type BoardRole, type BoardPermissions } from "@/types/board-member";
import { useBoardTasks, type TaskData } from "@/hooks/use-board-tasks";
import {
  useBoardProperties,
  useBoardViews,
  type BoardData as HookBoardData,
} from "@/hooks/use-board-properties";

interface BoardData extends Omit<Board, "createdAt" | "updatedAt"> {
  _id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  tasks: TaskData[];
  userRole?: BoardRole;
  userPermissions?: BoardPermissions;
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
  const [users, setUsers] = useState<UserOption[]>([]);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sorts, setSorts] = useState<SortConfig[]>([]);

  // Add Property Dialog State
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [addPropertyIndex, setAddPropertyIndex] = useState<number | null>(null);

  // Convert board to hook format
  const hookBoardData: HookBoardData = {
    _id: board._id,
    name: board.name,
    description: board.description,
    icon: board.icon,
    ownerId: board.ownerId,
    properties: board.properties,
    views: board.views,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };

  // Board update handler
  const handleBoardUpdate = useCallback((updated: HookBoardData) => {
    setBoard((prev) => ({ ...prev, ...updated }));
  }, []);

  // ============================================
  // USE HOOKS
  // ============================================

  // Views hook
  const { activeView, setActiveViewId, updateGroupBy, updateAggregation, toggleColumnVisibility } =
    useBoardViews({
      board: hookBoardData,
      onBoardUpdate: handleBoardUpdate,
    });

  // Tasks hook
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    reorderTasks,
    moveTaskToGroup,
  } = useBoardTasks({
    boardId: board._id,
    initialTasks: initialBoard.tasks,
    groupByPropertyId: activeView?.config.groupBy,
  });

  // Properties hook
  const {
    properties,
    addProperty,
    removeProperty,
    renameProperty,
    reorderProperties,
    updatePropertyWidth,
    addPropertyOption,
    updatePropertyOption,
  } = useBoardProperties({
    board: hookBoardData,
    onBoardUpdate: handleBoardUpdate,
  });

  // Fetch board members for assignment (not all users)
  useEffect(() => {
    fetch(`/api/boards/${board._id}/members`)
      .then((res) => res.json())
      .then((data) => {
        // Map members to user options format
        const memberUsers = (data.members || []).map(
          (m: { userId: string; user: { name: string; email: string } }) => ({
            id: m.userId,
            name: m.user.name,
            email: m.user.email,
          })
        );
        setUsers(memberUsers);
      })
      .catch((err) => console.error("Failed to fetch board members:", err));
  }, [board._id]);

  // Update board (for non-property/view updates like name, icon, etc.)
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

  // Open Add Property Dialog
  const handleOpenAddProperty = useCallback((index?: number) => {
    setAddPropertyIndex(typeof index === "number" ? index : null);
    setIsAddPropertyOpen(true);
  }, []);

  // Handle add property with index
  const handleAddProperty = useCallback(
    async (property: Omit<Property, "id" | "order">) => {
      await addProperty(property, addPropertyIndex ?? undefined);
      setAddPropertyIndex(null);
    },
    [addProperty, addPropertyIndex]
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

  // Wrapper for task operations to match expected interface
  const handleCreateTask = useCallback(
    async (title: string, properties?: Record<string, unknown>) => {
      return await createTask({ title, properties: properties || {} });
    },
    [createTask]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<TaskData>) => {
      await updateTask(taskId, updates);
    },
    [updateTask]
  );

  // Handler for moving task to different column (Kanban)
  const handleMoveTask = useCallback(
    (taskId: string, targetGroupValue: string | null, targetIndex: number) => {
      moveTaskToGroup({ taskId, targetGroupValue, targetIndex });
    },
    [moveTaskToGroup]
  );

  // Board data with synced properties for child components
  const boardWithSyncedProps = {
    ...board,
    properties,
  };

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
        properties={properties}
        filters={filters}
        sorts={sorts}
        groupBy={activeView?.config.groupBy}
        visibleProperties={activeView?.config.visibleProperties}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPropertyClick={() => handleOpenAddProperty()}
        onRemoveProperty={removeProperty}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
        onAddSort={handleAddSort}
        onRemoveSort={handleRemoveSort}
        onClearSorts={handleClearSorts}
        onGroupByChange={updateGroupBy}
        onToggleColumnVisibility={toggleColumnVisibility}
      />

      <div className="flex-1 overflow-auto">
        {activeView?.type === ViewType.TABLE && (
          <TableView
            board={boardWithSyncedProps}
            tasks={tasks}
            view={activeView}
            searchQuery={searchQuery}
            filters={filters}
            sorts={sorts}
            users={users}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={deleteTask}
            onRemoveProperty={removeProperty}
            onAddPropertyOption={addPropertyOption}
            onUpdatePropertyOption={updatePropertyOption}
            onUpdatePropertyWidth={updatePropertyWidth}
            onReorderTasks={reorderTasks}
            onReorderProperties={reorderProperties}
            onRenameProperty={renameProperty}
            onAddPropertyAt={handleOpenAddProperty}
            onUpdateAggregation={updateAggregation}
            onBulkDeleteTasks={bulkDeleteTasks}
          />
        )}

        {activeView?.type === ViewType.KANBAN && (
          <KanbanView
            board={boardWithSyncedProps}
            tasks={tasks}
            view={activeView}
            searchQuery={searchQuery}
            filters={filters}
            sorts={sorts}
            users={users}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={deleteTask}
            onMoveTask={handleMoveTask}
            onAddPropertyOption={addPropertyOption}
            onUpdatePropertyOption={updatePropertyOption}
          />
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
