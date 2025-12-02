"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BoardHeader } from "@/components/boards/board-header";
import { TableView } from "@/components/boards/views/table-view";
import { type Board, type Task, type View, ViewType } from "@/types/board";

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
  const router = useRouter();
  const [board, setBoard] = useState(initialBoard);
  const [tasks, setTasks] = useState(initialBoard.tasks);
  const [activeViewId, setActiveViewId] = useState(
    board.views.find((v) => v.isDefault)?.id || board.views[0]?.id
  );

  const activeView = board.views.find((v) => v.id === activeViewId);

  // Update board name
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
      try {
        const res = await fetch(`/api/boards/${board._id}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? { ...t, ...updated } : t))
          );
        }
      } catch (error) {
        console.error("Failed to update task:", error);
      }
    },
    [board._id]
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

      <div className="flex-1 overflow-auto">
        {activeView?.type === ViewType.TABLE && (
          <TableView
            board={board}
            tasks={tasks}
            view={activeView}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
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
