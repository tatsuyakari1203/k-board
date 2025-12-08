import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserService } from "@/services/user.service";
import { USER_ROLES } from "@/types/user";
import { createUserSchema, userFilterSchema } from "@/lib/validations/admin";

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

// GET /api/admin/users - List all users with filters
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const filters = userFilterSchema.parse({
      status: searchParams.get("status") || undefined,
      role: searchParams.get("role") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    // Count total
    const { users, total } = await UserService.getUsers({
      ...filters,
      isActive:
        filters.isActive === "true" ? true : filters.isActive === "false" ? false : undefined,
    });
    const counts = await UserService.getUserCounts();

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        _id: u._id.toString(),
        approvedBy: u.approvedBy?.toString(),
        createdBy: u.createdBy?.toString(),
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
      counts,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users - Create user manually
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validated = createUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const user = await UserService.createUser(validated.data, authResult.session.user.id);

      return NextResponse.json(
        {
          message: "Tạo người dùng thành công",
          user: {
            _id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            isActive: user.isActive,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Email_Exists") {
        return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
