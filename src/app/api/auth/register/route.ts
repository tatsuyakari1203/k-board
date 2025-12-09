import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { getRegistrationMode, REGISTRATION_MODE } from "@/models/system-settings.model";
import { registerSchema } from "@/lib/validations/auth";
import { USER_ROLES, USER_STATUS, type UserRole } from "@/types/user";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for auth endpoints
    const rateLimitResult = checkRateLimit(request, "AUTH");
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const body = await request.json();

    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for existing users to determine if this is the first user (First Run)
    const userCount = await User.countDocuments({});
    const isFirstUser = userCount === 0;

    // Check registration mode (bypass if it's the first user)
    const registrationMode = await getRegistrationMode();

    if (!isFirstUser && registrationMode === REGISTRATION_MODE.DISABLED) {
      return NextResponse.json(
        { error: "Đăng ký tài khoản hiện đang bị tắt. Vui lòng liên hệ quản trị viên." },
        { status: 403 }
      );
    }

    const existingUser = await User.findOne({
      email: validated.data.email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    // Determine status, role and isActive
    // If first user: Always ADMIN, APPROVED, ACTIVE
    // Otherwise: Follow registration mode
    const isAutoApprove = registrationMode === REGISTRATION_MODE.AUTO_APPROVE; // Default rule

    let status = isAutoApprove ? USER_STATUS.APPROVED : USER_STATUS.PENDING;
    let isActive = isAutoApprove;
    let role: UserRole = USER_ROLES.USER;

    if (isFirstUser) {
      status = USER_STATUS.APPROVED;
      isActive = true;
      role = USER_ROLES.ADMIN;
    }

    const user = await User.create({
      email: validated.data.email,
      name: validated.data.name,
      password: validated.data.password,
      role: role,
      status,
      isActive,
      ...((isAutoApprove || isFirstUser) && { approvedAt: new Date() }),
    });

    // Return different messages based on mode
    const message = isAutoApprove
      ? "Đăng ký thành công. Bạn có thể đăng nhập ngay."
      : "Đăng ký thành công. Tài khoản của bạn đang chờ quản trị viên phê duyệt.";

    return NextResponse.json(
      {
        message,
        requiresApproval: !isAutoApprove,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
