import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import User from "@/models/user.model";
import { connectDB } from "@/lib/db";

// PUT /api/users/profile - Update own profile
// PUT /api/users/profile - Update own profile
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image, phone, department, position, currentPassword, newPassword } = body;

    await connectDB();

    const user = await User.findById(session.user.id).select("+password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle password update
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
      user.password = newPassword;
    }

    // Update other fields
    if (name) user.name = name.trim();
    if (image !== undefined) user.image = image;
    if (phone !== undefined) user.phone = phone.trim();
    if (department !== undefined) user.department = department.trim();
    if (position !== undefined) user.position = position.trim();

    user.updatedAt = new Date();

    await user.save();

    // Return user without password
    const userObj = user.toObject();
    const { password: _password, ...updatedUser } = userObj;

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("PUT /api/users/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
