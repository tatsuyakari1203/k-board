import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { loginSchema } from "@/lib/validations/auth";
import { USER_ROLES, USER_STATUS, type UserRole } from "@/types/user";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
      phone?: string | null;
      department?: string | null;
      position?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    image?: string | null;
    phone?: string | null;
    department?: string | null;
    position?: string | null;
  }
}

// Custom error class for specific auth errors
class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validated = loginSchema.safeParse(credentials);

          if (!validated.success) {
            return null;
          }

          await connectDB();

          const user = await User.findByEmail(validated.data.email);

          if (!user) {
            return null;
          }

          // Admin users bypass status checks
          const isAdmin = user.role === USER_ROLES.ADMIN;

          // Check user status (skip for admin)
          if (!isAdmin && user.status === USER_STATUS.PENDING) {
            throw new AuthError(
              "Tài khoản của bạn đang chờ phê duyệt. Vui lòng liên hệ quản trị viên.",
              "PENDING_APPROVAL"
            );
          }

          if (!isAdmin && user.status === USER_STATUS.REJECTED) {
            throw new AuthError(
              "Tài khoản của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên.",
              "REJECTED"
            );
          }

          if (!isAdmin && !user.isActive) {
            throw new AuthError(
              "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
              "INACTIVE"
            );
          }

          const isPasswordValid = await user.comparePassword(validated.data.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            phone: user.phone,
            department: user.department,
            position: user.position,
          };
        } catch (error) {
          if (error instanceof AuthError) {
            // Re-throw AuthError to be handled by the client
            throw error;
          }
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // Run basic JWT callback first
      const basicToken = await authConfig.callbacks?.jwt?.({ token, user, trigger, session });
      if (basicToken) token = basicToken;

      if (user) {
        // Already handled in basic callback
      } else if (token?.id) {
        // Optimization: For subsequent requests, validate user against DB
        // This ensures deleted/blocked users are invalidated immediately
        // and role changes are reflected without re-login.
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select(
            "role status isActive name image phone department position"
          );

          if (!dbUser) {
            console.warn(`User ${token.id} not found in DB. Invalidating token.`);
            return null; // Invalidates session
          }

          // Check status
          const isAdmin = dbUser.role === USER_ROLES.ADMIN;
          if (!isAdmin && (dbUser.status !== USER_STATUS.APPROVED || !dbUser.isActive)) {
            return null;
          }

          // Sync verifyable fields
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.phone = dbUser.phone;
          token.department = dbUser.department;
          token.position = dbUser.position;
        } catch (error) {
          console.error("Error validating user in JWT callback:", error);
          // Don't kill session on DB connection error to be resilient?
          // Or fail safe? secure = fail closed.
          // For now, if DB fails, we might want to keep existing token or fail.
          // Choosing to return current token to avoid outage during transient DB issues.
        }
      }

      return token;
    },
  },
});
