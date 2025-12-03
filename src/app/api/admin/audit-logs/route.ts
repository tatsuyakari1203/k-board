import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AuditLog from "@/models/audit-log.model";
import { USER_ROLES } from "@/types/user";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().optional(),
  entityType: z.string().optional(),
  performedBy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/admin/audit-logs - Get audit logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 }
      );
    }

    await connectDB();

    // Parse query params
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "50",
      action: url.searchParams.get("action") || undefined,
      entityType: url.searchParams.get("entityType") || undefined,
      performedBy: url.searchParams.get("performedBy") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    };

    const validated = querySchema.parse(queryParams);

    // Build query
    const query: Record<string, unknown> = {};

    if (validated.action) {
      query.action = validated.action;
    }

    if (validated.entityType) {
      query.entityType = validated.entityType;
    }

    if (validated.performedBy) {
      query.performedBy = validated.performedBy;
    }

    if (validated.startDate || validated.endDate) {
      query.performedAt = {};
      if (validated.startDate) {
        (query.performedAt as Record<string, Date>).$gte = new Date(validated.startDate);
      }
      if (validated.endDate) {
        (query.performedAt as Record<string, Date>).$lte = new Date(validated.endDate);
      }
    }

    const skip = (validated.page - 1) * validated.limit;

    // Get total count
    const total = await AuditLog.countDocuments(query);

    // Get logs
    const logs = await AuditLog.find(query)
      .populate("performedBy", "name email")
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(validated.limit)
      .lean();

    return NextResponse.json({
      logs: logs.map((log) => {
        const performer = log.performedBy as unknown as {
          _id: { toString: () => string };
          name: string;
          email: string;
        };

        return {
          _id: log._id.toString(),
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId.toString(),
          entityName: log.entityName,
          performedBy: performer ? {
            _id: performer._id.toString(),
            name: performer.name,
            email: performer.email,
          } : null,
          performedAt: log.performedAt,
          ipAddress: log.ipAddress,
          details: log.details,
          previousValue: log.previousValue,
          newValue: log.newValue,
        };
      }),
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages: Math.ceil(total / validated.limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/audit-logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
