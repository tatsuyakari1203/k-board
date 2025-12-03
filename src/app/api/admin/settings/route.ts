import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  getSetting,
  setSetting,
  SETTING_KEYS,
  REGISTRATION_MODE,
  type RegistrationMode
} from "@/models/system-settings.model";
import { USER_ROLES } from "@/types/user";
import { updateSettingsSchema } from "@/lib/validations/admin";

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

// GET /api/admin/settings - Get all settings
export async function GET() {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();

    const registrationMode = await getSetting<RegistrationMode>(
      SETTING_KEYS.USER_REGISTRATION_MODE
    );

    return NextResponse.json({
      settings: {
        user_registration_mode: registrationMode || REGISTRATION_MODE.MANUAL_APPROVE,
      },
      options: {
        registration_modes: [
          { value: REGISTRATION_MODE.AUTO_APPROVE, label: "Tự động duyệt" },
          { value: REGISTRATION_MODE.MANUAL_APPROVE, label: "Duyệt thủ công" },
          { value: REGISTRATION_MODE.DISABLED, label: "Tắt đăng ký" },
        ],
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settings - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const validated = updateSettingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const updates: Record<string, unknown> = {};

    if (validated.data.user_registration_mode) {
      await setSetting(
        SETTING_KEYS.USER_REGISTRATION_MODE,
        validated.data.user_registration_mode,
        authResult.session.user.id
      );
      updates.user_registration_mode = validated.data.user_registration_mode;
    }

    return NextResponse.json({
      message: "Cập nhật cài đặt thành công",
      settings: updates,
    });
  } catch (error) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
