"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { USER_ROLES, type UserRole } from "@/types/user";

interface UserFormModalProps {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
  const t = useTranslations("Admin.users.modal");
  const tUsers = useTranslations("Users");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: (user?.role || USER_ROLES.USER) as UserRole,
  });

  const isEditing = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/admin/users/${user._id}` : "/api/admin/users";
      const method = isEditing ? "PATCH" : "POST";

      const body = isEditing
        ? {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            ...(formData.password && { password: formData.password }),
          }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("error"));
        return;
      }

      onSuccess();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-background w-full max-w-lg mx-4 rounded-xl shadow-xl">
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-8">
            {isEditing ? t("editTitle") : t("addTitle")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-base text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                {t("name")}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 text-base bg-transparent border-b-2 focus:border-foreground focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                {t("email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 text-base bg-transparent border-b-2 focus:border-foreground focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                {isEditing ? t("newPassword") : t("password")}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEditing}
                minLength={6}
                placeholder={isEditing ? t("passwordPlaceholder") : ""}
                className="w-full px-4 py-3 text-base bg-transparent border-b-2 focus:border-foreground focus:outline-none transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                {t("role")}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-4 py-3 text-base bg-transparent border-b-2 focus:border-foreground focus:outline-none cursor-pointer"
              >
                {Object.values(USER_ROLES).map((role) => (
                  <option key={role} value={role}>
                    {tUsers(`roles.${role}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-base hover:bg-muted rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 text-base bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : isEditing ? (
                  t("save")
                ) : (
                  t("create")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
