import { RoleList } from "@/components/admin/roles/role-list";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("AdminRoles");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function RolesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <RoleList />
    </div>
  );
}
