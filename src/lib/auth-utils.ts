import { auth } from "@/lib/auth";
import { ROLE_HIERARCHY, type UserRole } from "@/types/user";

/**
 * Get current session on server
 */
export async function getSession() {
  return await auth();
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user has exact role
 */
export function isRole(userRole: UserRole, role: UserRole): boolean {
  return userRole === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Check if user is at least manager
 */
export function isManagerOrAbove(userRole: UserRole): boolean {
  return hasRole(userRole, "manager");
}

/**
 * Check if user is at least staff
 */
export function isStaffOrAbove(userRole: UserRole): boolean {
  return hasRole(userRole, "staff");
}
