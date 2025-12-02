import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";

// GET /api/users - List all active users (for assignment)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const users = await User.find({ isActive: true })
      .select("_id name email image role")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(
      users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
      }))
    );
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
