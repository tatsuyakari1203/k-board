import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { USER_ROLES, USER_STATUS } from "@/types/user";
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
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();

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

    // Build query
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === "true";
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Count total
    const total = await User.countDocuments(query);

    // Get paginated results
    const skip = (filters.page - 1) * filters.limit;
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .lean();

    // Get counts by status
    const statusCounts = await User.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = {
      total,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    statusCounts.forEach((s) => {
      if (s._id === USER_STATUS.PENDING) counts.pending = s.count;
      if (s._id === USER_STATUS.APPROVED) counts.approved = s.count;
      if (s._id === USER_STATUS.REJECTED) counts.rejected = s.count;
    });

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create user manually
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAccess();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const validated = createUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email exists
    const existingUser = await User.findOne({
      email: validated.data.email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email đã được sử dụng" },
        { status: 409 }
      );
    }

    // Create user - auto approved since created by admin
    const user = await User.create({
      ...validated.data,
      status: USER_STATUS.APPROVED,
      isActive: validated.data.isActive ?? true,
      approvedBy: authResult.session.user.id,
      approvedAt: new Date(),
      createdBy: authResult.session.user.id,
    });

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
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
