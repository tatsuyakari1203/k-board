import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Role from "@/models/role.model";
import { USER_ROLES } from "@/types/user";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch all system roles (boardId is null)
    const roles = await Role.find({ boardId: null }).sort({ createdAt: -1 });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, description, permissions } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    await dbConnect();

    // Check if slug already exists
    const existingRole = await Role.findOne({ slug, boardId: null });
    if (existingRole) {
      return NextResponse.json({ error: "Role with this slug already exists" }, { status: 400 });
    }

    const newRole = await Role.create({
      name,
      slug,
      description,
      permissions: permissions || [],
      isSystem: false, // Created by admin, so not a hard-coded system role
      boardId: null,
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
