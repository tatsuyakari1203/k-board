import Task from "@/models/task.model";
import { connectDB } from "@/lib/db";

export class TaskService {
  /**
   * Get all tasks for a specific board
   */
  static async getTasksByBoardId(boardId: string) {
    await connectDB();
    return Task.find({ boardId }).sort({ order: 1 }).lean();
  }

  /**
   * Delete all tasks associated with a board
   */
  static async deleteTasksByBoardId(boardId: string) {
    await connectDB();
    return Task.deleteMany({ boardId });
  }

  /**
   * Get task counts for a list of board IDs
   */
  static async getTaskCountsByBoardIds(boardIds: string[]) {
    await connectDB();
    const taskCounts = await Task.aggregate([
      { $match: { boardId: { $in: boardIds } } },
      { $group: { _id: "$boardId", count: { $sum: 1 } } },
    ]);

    return new Map(taskCounts.map((tc) => [tc._id.toString(), tc.count]));
  }
}
