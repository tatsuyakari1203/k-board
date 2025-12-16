import { getCurrentUser } from "@/lib/auth-utils";
import { Sidebar, MobileSidebar } from "@/components/dashboard/sidebar";
import { redirect } from "@/i18n/routing";
import { USER_ROLES } from "@/types/user";
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts";
import { getLocale } from "next-intl/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const locale = await getLocale();

  if (!user) {
    redirect({ href: "/auth/login", locale });
    return null;
  }

  const isAdmin = user.role === USER_ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-background">
      <DashboardShortcuts />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-64 border-r bg-sidebar">
        <Sidebar isAdmin={isAdmin} />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 border-b bg-background flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <MobileSidebar isAdmin={isAdmin} />
          <span className="font-semibold text-lg">K-Board</span>
        </div>
      </div>

      {/* Main content */}
      <main className="md:pl-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
