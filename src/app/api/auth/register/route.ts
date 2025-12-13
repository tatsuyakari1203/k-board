import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { AuthService } from "@/services/auth.service";

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

    try {
      const { user, isAutoApprove } = await AuthService.register(validated.data);

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === "Registration_Disabled") {
          return NextResponse.json(
            { error: "Đăng ký tài khoản hiện đang bị tắt. Vui lòng liên hệ quản trị viên." },
            { status: 403 }
          );
        }
        if (error.message === "Email_Exists") {
          return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
