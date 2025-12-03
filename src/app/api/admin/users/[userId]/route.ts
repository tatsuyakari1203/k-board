import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { USER_ROLES } from "@/types/user";
import { updateUserSchema } from "@/lib/validations/admin";

// Helper to check admin access
async function checkAdminAccess() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== USER_ROLES.ADMIN) {
    return { error: "Forbidden - Admin only", status: 403 };
  }
  return { session };
}

// GET /api/admin/users/[userId] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = await params;
    await connectDB();

    const user = await User.findById(userId)
      .select("-password")
      .populate("approvedBy", "name email")
      .populate("createdBy", "name email")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      _id: user._id.toString(),
    });
  } catch (error) {
    console.error("GET /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[userId] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    // Prevent self-demotion from admin
    if (
      userId === authResult.session.user.id &&
      validated.data.role &&
      validated.data.role !== USER_ROLES.ADMIN
    ) {
      return NextResponse.json(
        { error: "Không thể hạ cấp chính mình" },
        { status: 400 }
      );
    }

    // If email is being changed, check for duplicates
    if (validated.data.email && validated.data.email !== user.email) {
      const existingUser = await User.findOne({
        email: validated.data.email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email đã được sử dụng" },
          { status: 409 }
        );
      }
    }

    // Update user
    const updateData: Record<string, unknown> = { ...validated.data };

    // If password is provided, it will be hashed by the pre-save hook
    if (validated.data.password) {
      user.password = validated.data.password;
      await user.save();
      delete updateData.password;
    }

    // Update other fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    return NextResponse.json({
      message: "Cập nhật thành công",
      user: {
        ...updatedUser?.toObject(),
        _id: updatedUser?._id.toString(),
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = await params;

    // Prevent self-deletion
    if (userId === authResult.session.user.id) {
      return NextResponse.json(
        { error: "Không thể xóa chính mình" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
    console.error("DELETE /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
