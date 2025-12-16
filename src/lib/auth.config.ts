import type { NextAuthConfig } from "next-auth";
import { type UserRole } from "@/types/user";

export const authConfig = {
  secret: process.env.AUTH_SECRET, // Add secret here
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [], // Configured in auth.ts
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.department = user.department;
        token.position = user.position;
        token.name = user.name;
        token.picture = user.image;
      }

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
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string | undefined;
        session.user.department = token.department as string | undefined;
        session.user.position = token.position as string | undefined;
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
    authorized({ auth }) {
      // Logic authorized có thể đặt ở đây hoặc trong middleware
      // Return true để cho phép, false để chặn
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
