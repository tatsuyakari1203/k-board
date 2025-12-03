import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { USER_STATUS } from "@/types/user";

// GET /api/users - List all active users (for assignment and staff directory)
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

    const users = await User.find({
      isActive: true,
      status: USER_STATUS.APPROVED,
    })
      .select("_id name email image role phone department position createdAt")
      .sort({ name: 1 })
      .lean();

    // Return both formats for backward compatibility
    const formattedUsers = users.map((u) => ({
      _id: u._id.toString(),
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      phone: u.phone,
      department: u.department,
      position: u.position,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      users: formattedUsers,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
