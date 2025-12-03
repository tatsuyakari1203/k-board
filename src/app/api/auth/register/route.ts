import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { getRegistrationMode, REGISTRATION_MODE } from "@/models/system-settings.model";
import { registerSchema } from "@/lib/validations/auth";
import { USER_ROLES, USER_STATUS } from "@/types/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Check registration mode
    const registrationMode = await getRegistrationMode();

    if (registrationMode === REGISTRATION_MODE.DISABLED) {
      return NextResponse.json(
        { error: "Đăng ký tài khoản hiện đang bị tắt. Vui lòng liên hệ quản trị viên." },
        { status: 403 }
      );
    }

    const existingUser = await User.findOne({
      email: validated.data.email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email đã được sử dụng" },
        { status: 409 }
      );
    }

    // Determine status and isActive based on registration mode
    const isAutoApprove = registrationMode === REGISTRATION_MODE.AUTO_APPROVE;
    const status = isAutoApprove ? USER_STATUS.APPROVED : USER_STATUS.PENDING;
    const isActive = isAutoApprove;

    const user = await User.create({
      email: validated.data.email,
      name: validated.data.name,
      password: validated.data.password,
      role: USER_ROLES.USER,
      status,
      isActive,
      ...(isAutoApprove && { approvedAt: new Date() }),
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
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
