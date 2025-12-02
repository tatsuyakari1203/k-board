"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { UserRole } from "@/types/user";
import { ROLE_HIERARCHY } from "@/types/user";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const login = useCallback(
    async (email: string, password: string, callbackUrl?: string) => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Email hoặc mật khẩu không đúng");
      }

      router.push(callbackUrl || "/dashboard");
      router.refresh();
    },
    [router]
  );

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }, [router]);

  const hasRole = useCallback(
    (requiredRole: UserRole): boolean => {
      if (!user?.role) return false;
      return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
    },
    [user]
  );

  const isRole = useCallback(
    (role: UserRole): boolean => {
      return user?.role === role;
    },
    [user]
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    isRole,
  };
}
