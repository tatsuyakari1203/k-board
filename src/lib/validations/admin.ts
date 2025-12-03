import { z } from "zod";
import { USER_ROLES, USER_STATUS } from "@/types/user";
import { REGISTRATION_MODE } from "@/models/system-settings.model";

// ============================================
// USER MANAGEMENT SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF, USER_ROLES.USER]),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF, USER_ROLES.USER]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
});

export const approveUserSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectedReason: z.string().optional(),
});

export const userFilterSchema = z.object({
  status: z.enum([USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.REJECTED]).optional(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF, USER_ROLES.USER]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

// ============================================
// SETTINGS SCHEMAS
// ============================================

export const updateSettingsSchema = z.object({
  user_registration_mode: z.enum([
    REGISTRATION_MODE.AUTO_APPROVE,
    REGISTRATION_MODE.MANUAL_APPROVE,
    REGISTRATION_MODE.DISABLED,
  ]).optional(),
});

// ============================================
// TYPES
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ApproveUserInput = z.infer<typeof approveUserSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
