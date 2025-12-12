import dotenv from "dotenv";
import { connectDB } from "../lib/db.js"; // Note: .js extension for direct execution if needed, or tsx handles it
import Role from "../models/role.model.js";
import { BOARD_ROLE_PERMISSIONS } from "../types/board-member.js";

dotenv.config({ path: ".env.local" });

const SYSTEM_ROLES = [
  {
    name: "Owner",
    slug: "owner",
    description: "Full control over the board",
    isSystem: true,
    permissions: getPermissionsParams("owner"),
  },
  {
    name: "Admin",
    slug: "admin",
    description: "Can manage members and settings",
    isSystem: true,
    permissions: getPermissionsParams("admin"),
  },
  {
    name: "Editor",
    slug: "editor",
    description: "Can create and edit tasks",
    isSystem: true,
    permissions: getPermissionsParams("editor"),
  },
  {
    name: "Viewer",
    slug: "viewer",
    description: "Can view tasks only",
    isSystem: true,
    permissions: getPermissionsParams("viewer"),
  },
  {
    name: "Restricted Editor",
    slug: "restricted_editor",
    description: "Can only edit assigned tasks",
    isSystem: true,
    permissions: getPermissionsParams("restricted_editor"),
  },
  {
    name: "Restricted Viewer",
    slug: "restricted_viewer",
    description: "Can only view assigned tasks",
    isSystem: true,
    permissions: getPermissionsParams("restricted_viewer"),
  },
];

// Helper to convert the old BoardPermissions object to a list of permission strings
// This ensures we map exactly what was hardcoded to the new DB format
function getPermissionsParams(roleSlug: string): string[] {
  // We need to access the object dynamically. checking if we can import the constant.
  // Since we are inside a script, let's just manually map for safety and clarity in this seed script
  // based on what was in the types/board-member.ts file
  const permissions: string[] = [];

  // Mapping logic based on role slug
  // Common read permission
  permissions.push("board.view");

  if (roleSlug === "owner" || roleSlug === "admin") {
    permissions.push("board.edit", "members.manage");
  }

  if (roleSlug === "owner") {
    permissions.push("board.delete");
  }

  if (roleSlug === "viewer") {
    // Just view
    return permissions;
  }

  // Task permissions
  if (["owner", "admin", "editor"].includes(roleSlug)) {
    permissions.push("task.create", "task.edit", "task.delete");
  }

  if (roleSlug === "restricted_editor") {
    permissions.push("task.create", "task.edit.assigned");
  }

  if (roleSlug === "restricted_viewer") {
    // Restricted viewer logic is usually handled by scope, but simpler permission model:
    // If they have "task.view" they see all, "task.view.assigned" they see assigned.
    // However, the previous logic had `viewScope: "assigned"`
    // Let's use specific permission flags for this:
    permissions.push("view.scope.assigned");
  } else {
    permissions.push("view.scope.all");
  }

  if (roleSlug === "restricted_editor") {
    permissions.push("edit.scope.assigned");
  } else if (["owner", "admin", "editor"].includes(roleSlug)) {
    permissions.push("edit.scope.all");
  }

  return permissions;
}

async function seedRoles() {
  console.log("🌱 Seeding System Roles...");

  try {
    await connectDB();

    // Clear existing system roles to ensure fresh state if re-running
    // Or upsert. Upsert is safer.

    for (const role of SYSTEM_ROLES) {
      await Role.findOneAndUpdate(
        { slug: role.slug, boardId: null },
        { ...role, boardId: null },
        { upsert: true, new: true }
      );
      console.log(`✅ Processed role: ${role.name}`);
    }

    console.log("✨ Roles seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    process.exit(1);
  }
}

seedRoles();
