import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

// Routes that don't require authentication
const publicRoutes = ["/auth/login", "/auth/register", "/auth/error", "/auth/forgot-password"];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  "/dashboard/admin": ["admin"],
  // "/management": ["admin", "manager"], // Example
  "/dashboard": [
    "admin",
    "manager",
    "staff",
    "user",
    "owner",
    "editor",
    "viewer",
    "restricted_editor",
    "restricted_viewer",
  ], // Added board roles just in case, though system roles usually suffice
};

// API routes that require specific roles
const apiRoleRoutes: Record<string, string[]> = {
  "/api/admin": ["admin"],
};

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  // 1. Helper to strip locale from path for checking
  // e.g. /vi/dashboard -> /dashboard
  // e.g. /dashboard -> /dashboard (if locale missing, though next-intl handles this)
  const pathname = nextUrl.pathname;

  // Check if API route (no locale)
  const isApiRoute = pathname.startsWith("/api");
  const isStaticRoute = pathname.startsWith("/_next") || pathname.includes(".");

  if (isStaticRoute) {
    return NextResponse.next();
  }

  // 2. Handle API routes (bypass intl)
  if (isApiRoute) {
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const userRole = session?.user?.role as string | undefined;

    for (const [path, allowedRoles] of Object.entries(apiRoleRoutes)) {
      if (pathname.startsWith(path)) {
        if (!isLoggedIn || !userRole || !allowedRoles.includes(userRole)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }
    return NextResponse.next();
  }

  // 3. Run intl middleware
  // This handles / -> /vi, adds locale prefix, etc.
  const response = intlMiddleware(req);

  // If next-intl redirects (e.g. root to default locale), let it happen
  if (response.headers.get("location")) {
    return response;
  }

  // 4. Auth Logic for Pages
  // We need to normalize the path to check against our rules
  // Remove the locale segment: /vi/dashboard -> /dashboard
  const locale = nextUrl.pathname.split("/")[1];
  const isLocaleValid = routing.locales.includes(locale as "vi" | "en");

  let pathWithoutLocale = nextUrl.pathname;
  if (isLocaleValid) {
    pathWithoutLocale = "/" + nextUrl.pathname.split("/").slice(2).join("/");
    if (pathWithoutLocale === "//") pathWithoutLocale = "/"; // fix root
  }

  // Normalize for empty/root
  if (pathWithoutLocale === "") pathWithoutLocale = "/";

  // Get Token
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role as string | undefined;

  const isAuthRoute = pathWithoutLocale.startsWith("/auth");

  // Check if strictly public (e.g. landing page /)
  // Our landing page is public.
  const isPublicPage = pathWithoutLocale === "/";
  // Also check public routes list
  const isPublicRoute = publicRoutes.some((route) => pathWithoutLocale.startsWith(route));

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    // Redirect to /<locale>/dashboard
    const localePrefix = isLocaleValid ? locale : routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${localePrefix}/dashboard`, nextUrl));
  }

  // Protect Dashboard and other private routes
  if (!isLoggedIn && !isPublicPage && !isPublicRoute && !isAuthRoute) {
    // Redirect to login
    // Construct callback URL
    const localePrefix = isLocaleValid ? locale : routing.defaultLocale;
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/${localePrefix}/auth/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Role-based access control for pages
  if (isLoggedIn && userRole) {
    for (const [path, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathWithoutLocale.startsWith(path)) {
        // Be careful with partial matches if needed, but startsWith is usually ok for /dashboard/admin
        // Need to ensure /dashboard matches all, but /dashboard/admin is more specific
        // We should probably check most specific first if we iterate, but map order is not identifying.
        // Logic in proxy.ts was: simple loop.

        if (!allowedRoles.includes(userRole)) {
          // Only block if the specific path requires a role the user DOESN'T have.
          // But wait, /dashboard matches /dashboard/admin.
          // If /dashboard allows "user", and /dashboard/admin allows "admin".
          // If "user" goes to /dashboard/admin.
          // startsWith("/dashboard") -> true -> allowed.
          // startsWith("/dashboard/admin") -> true -> DENIED.

          // We need to find the *most specific* matching rule?
          // Or just 'if any matching rule fails'?

          // Let's refine:
          // If path is exactly /dashboard/admin, and we fail, we deny.
          // The previous logic was:
          /*
                    for (const [path, allowedRoles] of Object.entries(roleRoutes)) {
                        if (nextUrl.pathname.startsWith(path)) {
                        if (!userRole || !allowedRoles.includes(userRole)) {
                            return NextResponse.redirect(new URL("/unauthorized", nextUrl));
                        }
                        }
                    }
                   */
          // This logic implies ANY match must be satisfied.
          // So if I am USER, and I go to /dashboard/admin.
          // Match /dashboard -> Allowed.
          // Match /dashboard/admin -> Not Allowed -> Redirect.
          // This works fine.

          const localePrefix = isLocaleValid ? locale : routing.defaultLocale;
          return NextResponse.redirect(new URL(`/${localePrefix}/unauthorized`, nextUrl));
        }
      }
    }
  }

  return response;
}

export const config = {
  // Combine next-intl matcher with general protection
  matcher: ["/", "/(vi|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
