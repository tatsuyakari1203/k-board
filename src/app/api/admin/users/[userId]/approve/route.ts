import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { USER_ROLES, USER_STATUS } from "@/types/user";
import { approveUserSchema } from "@/lib/validations/admin";

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

// POST /api/admin/users/[userId]/approve - Approve or reject user
export async function POST(
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
    const validated = approveUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
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

    if (user.status !== USER_STATUS.PENDING) {
      return NextResponse.json(
        { error: "Người dùng không ở trạng thái chờ duyệt" },
        { status: 400 }
      );
    }

    if (validated.data.action === "approve") {
      user.status = USER_STATUS.APPROVED;
      user.isActive = true;
      user.approvedBy = authResult.session.user.id as unknown as typeof user.approvedBy;
      user.approvedAt = new Date();
      user.rejectedReason = undefined;
    } else {
      user.status = USER_STATUS.REJECTED;
      user.isActive = false;
      user.rejectedReason = validated.data.rejectedReason || "Không đáp ứng yêu cầu";
    }

    await user.save();

    const message =
      validated.data.action === "approve"
        ? "Đã phê duyệt người dùng thành công"
        : "Đã từ chối người dùng";

    return NextResponse.json({
      message,
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        status: user.status,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/users/[userId]/approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
