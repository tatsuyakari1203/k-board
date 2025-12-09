"use client";

import { useState, useCallback, useRef } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { showToast } from "@/lib/toast";

// ============================================
// TYPES
// ============================================

export interface TaskData {
  _id: string;
  boardId: string;
  title: string;
  properties: Record<string, unknown>;
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  properties?: Record<string, unknown>;
}

export interface UpdateTaskInput {
  title?: string;
  properties?: Record<string, unknown>;
  order?: number;
}

export interface MoveTaskInput {
  taskId: string;
  targetGroupValue: string | null; // Giá trị mới của groupBy property
  targetIndex: number; // Vị trí mới trong group
  groupByPropertyId?: string; // Tùy chọn: ghi đè groupByPropertyId của hook
}

interface UseBoardTasksOptions {
  boardId: string;
  initialTasks: TaskData[];
  groupByPropertyId?: string; // Property ID dùng để group (cho Kanban)
}

interface UseBoardTasksReturn {
  tasks: TaskData[];
  isLoading: boolean;

  // CRUD operations
  createTask: (input: CreateTaskInput) => Promise<TaskData | null>;
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;

  // Reorder operations
  reorderTasks: (oldIndex: number, newIndex: number) => Promise<void>;
  moveTaskToGroup: (input: MoveTaskInput) => Promise<void>;

  // Utilities
  getTasksByGroup: (groupValue: string | null) => TaskData[];
  refreshTasks: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useBoardTasks({
  boardId,
  initialTasks,
  groupByPropertyId,
}: UseBoardTasksOptions): UseBoardTasksReturn {
  const [tasks, setTasks] = useState<TaskData[]>(() =>
    [...initialTasks].sort((a, b) => a.order - b.order)
  );
  const [isLoading, setIsLoading] = useState(false);

  // Keep ref for reverting on error
  const previousTasksRef = useRef<TaskData[]>(tasks);

  // ============================================
  // CREATE TASK
  // ============================================
  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<TaskData | null> => {
      try {
        const res = await fetch(`/api/boards/${boardId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            properties: input.properties || {},
          }),
        });

        if (res.ok) {
          const newTask = await res.json();
          setTasks((prev) => [...prev, newTask]);
          return newTask;
        } else {
          showToast.error("Không thể tạo công việc");
        }
      } catch (error) {
        console.error("Failed to create task:", error);
        showToast.error("Không thể tạo công việc");
      }
      return null;
    },
    [boardId]
  );

  // ============================================
  // UPDATE TASK
  // ============================================
  const updateTask = useCallback(
    async (taskId: string, updates: UpdateTaskInput): Promise<void> => {
      // Save previous state for rollback
      previousTasksRef.current = tasks;

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
        const res = await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          const updatedTask = await res.json();
          setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, ...updatedTask } : t)));
        } else {
          // Revert on error
          setTasks(previousTasksRef.current);
          showToast.error("Không thể cập nhật công việc");
        }
      } catch (error) {
        console.error("Failed to update task:", error);
        setTasks(previousTasksRef.current);
        showToast.error("Không thể cập nhật công việc");
      }
    },
    [boardId, tasks]
  );

  // ============================================
  // DELETE TASK
  // ============================================
  const deleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      previousTasksRef.current = tasks;

      // Optimistic update
      setTasks((prev) => prev.filter((t) => t._id !== taskId));

      try {
        const res = await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          setTasks(previousTasksRef.current);
          showToast.error("Không thể xóa công việc");
        } else {
          showToast.success("Đã xóa công việc");
        }
      } catch (error) {
        console.error("Failed to delete task:", error);
        setTasks(previousTasksRef.current);
        showToast.error("Không thể xóa công việc");
      }
    },
    [boardId, tasks]
  );

  // ============================================
  // BULK DELETE TASKS
  // ============================================
  const bulkDeleteTasks = useCallback(
    async (taskIds: string[]): Promise<void> => {
      previousTasksRef.current = tasks;

      // Optimistic update
      setTasks((prev) => prev.filter((t) => !taskIds.includes(t._id)));

      try {
        await Promise.all(
          taskIds.map((id) =>
            fetch(`/api/boards/${boardId}/tasks/${id}`, {
              method: "DELETE",
            })
          )
        );
        showToast.success(`Đã xóa ${taskIds.length} công việc`);
      } catch (error) {
        console.error("Failed to bulk delete tasks:", error);
        setTasks(previousTasksRef.current);
        showToast.error("Không thể xóa một số công việc");
      }
    },
    [boardId, tasks]
  );

  // ============================================
  // REORDER TASKS (within same list/column)
  // ============================================
  const reorderTasks = useCallback(
    async (oldIndex: number, newIndex: number): Promise<void> => {
      if (oldIndex === newIndex) return;

      previousTasksRef.current = tasks;

      const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
      const newTasks = arrayMove(sortedTasks, oldIndex, newIndex).map((t, index) => ({
        ...t,
        order: index,
      }));

      setTasks(newTasks);

      try {
        await fetch(`/api/boards/${boardId}/tasks/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds: newTasks.map((t) => t._id) }),
        });
      } catch (error) {
        console.error("Failed to reorder tasks:", error);
        setTasks(previousTasksRef.current);
      }
    },
    [boardId, tasks]
  );

  // ============================================
  // MOVE TASK TO GROUP (for Kanban)
  // ============================================
  const moveTaskToGroup = useCallback(
    async ({
      taskId,
      targetGroupValue,
      targetIndex,
      groupByPropertyId: overrideGroupId,
    }: MoveTaskInput): Promise<void> => {
      const effectiveGroupId = overrideGroupId || groupByPropertyId;

      if (!effectiveGroupId) {
        console.warn("moveTaskToGroup called without groupByPropertyId");
        return;
      }

      previousTasksRef.current = tasks;

      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;

      // 1. Update the groupBy property value
      const updatedTask = {
        ...task,
        properties: {
          ...task.properties,
          [effectiveGroupId]: targetGroupValue,
        },
      };

      // 2. Get tasks in target group and calculate new orders
      const targetGroupTasks = tasks
        .filter((t) => {
          if (t._id === taskId) return false; // Exclude the moving task
          const groupValue = t.properties[effectiveGroupId];
          if (targetGroupValue === null) {
            return groupValue === null || groupValue === undefined || groupValue === "";
          }
          return groupValue === targetGroupValue;
        })
        .sort((a, b) => a.order - b.order);

      // Insert at target index
      targetGroupTasks.splice(targetIndex, 0, updatedTask);

      // Recalculate orders for target group
      const reorderedTargetTasks = targetGroupTasks.map((t, index) => ({
        ...t,
        order: index,
      }));

      // 3. Update local state
      setTasks((prev) => {
        const otherTasks = prev.filter((t) => {
          if (t._id === taskId) return false;
          const groupValue = t.properties[effectiveGroupId];
          if (targetGroupValue === null) {
            return !(groupValue === null || groupValue === undefined || groupValue === "");
          }
          return groupValue !== targetGroupValue;
        });
        return [...otherTasks, ...reorderedTargetTasks];
      });

      // 4. Call APIs
      try {
        // First update the property value
        await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: { [effectiveGroupId]: targetGroupValue },
          }),
        });

        // Then reorder tasks in target group
        await fetch(`/api/boards/${boardId}/tasks/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskIds: reorderedTargetTasks.map((t) => t._id),
          }),
        });
      } catch (error) {
        console.error("Failed to move task to group:", error);
        setTasks(previousTasksRef.current);
      }
    },
    [boardId, groupByPropertyId, tasks]
  );

  // ============================================
  // GET TASKS BY GROUP
  // ============================================
  const getTasksByGroup = useCallback(
    (groupValue: string | null): TaskData[] => {
      if (!groupByPropertyId) return tasks;

      return tasks
        .filter((t) => {
          const value = t.properties[groupByPropertyId];
          if (groupValue === null) {
            return value === null || value === undefined || value === "";
          }
          return value === groupValue;
        })
        .sort((a, b) => a.order - b.order);
    },
    [groupByPropertyId, tasks]
  );

  // ============================================
  // REFRESH TASKS
  // ============================================
  const refreshTasks = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.sort((a: TaskData, b: TaskData) => a.order - b.order));
      }
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    reorderTasks,
    moveTaskToGroup,
    getTasksByGroup,
    refreshTasks,
  };
}
