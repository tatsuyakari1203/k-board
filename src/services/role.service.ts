import { connectDB } from "@/lib/db";
import Role from "@/models/role.model";
import mongoose from "mongoose";

export interface CreateRoleData {
  name: string;
  slug: string;
  description?: string;
  permissions?: string[];
}

export class RoleService {
  static async getSystemRoles() {
    await connectDB();
    return await Role.find({ boardId: null }).sort({ createdAt: -1 });
  }

  static async createSystemRole(data: CreateRoleData) {
    await connectDB();

    // Check if slug already exists
    const existingRole = await Role.findOne({ slug: data.slug, boardId: null });
    if (existingRole) {
      throw new Error("Role_Slug_Exists");
    }

    // Explicitly define the object to match Schema expectation if needed, or simply remove 'as any' if the previous error was due to strictness
    const newRole = await Role.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      permissions: data.permissions || [],
      isSystem: false,
      boardId: null as unknown as mongoose.Types.ObjectId,
    });

    return newRole;
  }

  static async deleteSystemRole(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid ID");
    }

    await connectDB();

    // Validate role exists and is not system hardcoded (though isSystem logic is tricky, usually we assume admin can delete custom roles)
    // For now, simple delete
    const deleted = await Role.findOneAndDelete({ _id: id, boardId: null });

    if (!deleted) {
      throw new Error("Role not found");
    }

    return deleted;
  }

  static async updateSystemRole(id: string, data: Partial<CreateRoleData>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid ID");
    }

    await connectDB();

    const updateData: Partial<CreateRoleData> = { ...data };
    // If updating slug, check uniqueness
    if (data.slug) {
      const existingRole = await Role.findOne({
        slug: data.slug,
        boardId: null,
        _id: { $ne: id },
      });
      if (existingRole) {
        throw new Error("Role_Slug_Exists");
      }
    }

    const updated = await Role.findOneAndUpdate({ _id: id, boardId: null }, updateData, {
      new: true,
    });

    if (!updated) {
      throw new Error("Role not found");
    }

    return updated;
  }
}
