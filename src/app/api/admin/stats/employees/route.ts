import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import User from "@/models/user.model";
import { connectDB } from "@/lib/db";
import { USER_ROLES } from "@/types/user";

export async function GET() {
  try {
    const session = await auth();
    // Only Admin
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // 1. Get all users
    const users = await User.find({}).select("name email image department").lean();

    // 2. Mock Stats Calculation (Real impl requires complex aggregation over Tasks & Board Definitions)
    // TODO: Implement real aggregation:
    // - Fetch all Boards, Identify "Person" columns.
    // - Aggregate Tasks where properties[personCol] == userId.

    const stats = users.map((user) => {
      // Mock random data for demonstration
      // In production, replace this with actual counts from Task collection
      const totalTasks = Math.floor(Math.random() * 50) + 5;
      const completedTasks = Math.floor(Math.random() * totalTasks);
      const overdueTasks = Math.floor(Math.random() * (totalTasks - completedTasks));

      const completionRate = (completedTasks / totalTasks) * 100;

      // Simple productivity score formula
      let productivityScore = completionRate;
      if (overdueTasks > 5) productivityScore -= 20;
      if (productivityScore < 0) productivityScore = 0;

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        department: user.department,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        productivityScore,
      };
    });

    // Sort by productivity (low to high to highlight issues)
    stats.sort((a, b) => a.productivityScore - b.productivityScore);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/admin/stats/employees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
