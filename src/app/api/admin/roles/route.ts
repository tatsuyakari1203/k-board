import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RoleService } from "@/services/role.service";
import { USER_ROLES } from "@/types/user";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roles = await RoleService.getSystemRoles();

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, permissions } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    try {
      const newRole = await RoleService.createSystemRole({
        name,
        slug,
        description,
        permissions,
      });
      return NextResponse.json(newRole, { status: 201 });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Role_Slug_Exists") {
        return NextResponse.json({ error: "Role with this slug already exists" }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
