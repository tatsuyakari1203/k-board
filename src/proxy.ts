import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/error"];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  "/dashboard/admin": ["admin"],
  "/admin": ["admin"],
  "/management": ["admin", "manager"],
  "/dashboard": ["admin", "manager", "staff", "user"],
};

// API routes that require specific roles (checked in middleware)
const apiRoleRoutes: Record<string, string[]> = {
  "/api/admin": ["admin"],
};

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;

  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route
  );

  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isStaticRoute =
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.includes(".");

  // Allow static files
  if (isStaticRoute) {
    return NextResponse.next();
  }

  // Get token using next-auth/jwt (Edge compatible)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  // Check API route role-based access
  if (isApiRoute) {
    for (const [path, allowedRoles] of Object.entries(apiRoleRoutes)) {
      if (nextUrl.pathname.startsWith(path)) {
        if (!isLoggedIn || !userRole || !allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
          );
        }
      }
    }
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Check role-based access
  for (const [path, allowedRoles] of Object.entries(roleRoutes)) {
    if (nextUrl.pathname.startsWith(path)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", nextUrl));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
