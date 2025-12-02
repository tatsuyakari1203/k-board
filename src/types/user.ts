export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  USER: "user",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  manager: 75,
  staff: 50,
  user: 25,
};

export interface IUser {
  _id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserWithoutPassword = Omit<IUser, "password">;
