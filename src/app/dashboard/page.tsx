import { getCurrentUser } from "@/lib/auth-utils";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <DashboardClient userName={user.name || "Bạn"} />;
}
