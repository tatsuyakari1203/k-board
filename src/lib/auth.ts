import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { loginSchema } from "@/lib/validations/auth";
import { USER_ROLES, USER_STATUS, type UserRole } from "@/types/user";

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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.department = user.department;
        token.position = user.position;
        // Important: cache name/image in token so they persist
        token.name = user.name;
        token.picture = user.image;
      }

      // Handle session update
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
        if (session.phone !== undefined) token.phone = session.phone;
        if (session.department !== undefined) token.department = session.department;
        if (session.position !== undefined) token.position = session.position;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string | undefined;
        session.user.department = token.department as string | undefined;
        session.user.position = token.position as string | undefined;
        // Ensure name/image come from token (which might be updated)
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
