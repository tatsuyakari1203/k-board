import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import User from "@/models/user.model";
import { connectDB } from "@/lib/db";

// PUT /api/users/profile - Update own profile
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image, phone, department, position } = body;

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await connectDB();

    // Update only allowed fields
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: name.trim(),
        image: image,
        phone: phone?.trim(),
        department: department?.trim(),
        position: position?.trim(),
        updatedAt: new Date(),
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("PUT /api/users/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
