import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SETTING_KEYS, REGISTRATION_MODE, type RegistrationMode } from "@/types/system-settings";
import { USER_ROLES } from "@/types/user";
import { updateSettingsSchema } from "@/lib/validations/admin";
import { logSettingsUpdated } from "@/lib/audit";
import { SettingsService } from "@/services/settings.service";

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
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const registrationMode = await SettingsService.getSetting<RegistrationMode>(
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validated = updateSettingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    const previousValues: Record<string, unknown> = {};

    if (validated.data.user_registration_mode) {
      // Get previous value for audit
      const previousMode = await SettingsService.getSetting<RegistrationMode>(
        SETTING_KEYS.USER_REGISTRATION_MODE
      );
      previousValues.user_registration_mode = previousMode || REGISTRATION_MODE.MANUAL_APPROVE;

      await SettingsService.setSetting(
        SETTING_KEYS.USER_REGISTRATION_MODE,
        validated.data.user_registration_mode,
        authResult.session.user.id
      );
      updates.user_registration_mode = validated.data.user_registration_mode;
    }

    // Log audit
    if (Object.keys(updates).length > 0) {
      await logSettingsUpdated(authResult.session.user.id, previousValues, updates);
    }

    return NextResponse.json({
      message: "Cập nhật cài đặt thành công",
      settings: updates,
    });
  } catch (error) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
