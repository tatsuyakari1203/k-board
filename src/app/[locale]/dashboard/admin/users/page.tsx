"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Check,
  X,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { USER_ROLES, type UserRole, type UserStatus } from "@/types/user";
import { useTranslations, useLocale } from "next-intl";

interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  createdAt: string;
  approvedAt?: string;
  rejectedReason?: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Admin.users");
  const tCommon = useTranslations("Common");
  const tUsers = useTranslations("Users"); // For roles
  const locale = useLocale();

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusFilter = searchParams.get("status") as UserStatus | null;
  const currentPage = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", currentPage.toString());

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt(t("actions.rejectReason"));
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectedReason: reason }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t("actions.confirmDelete"))) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Failed to toggle active:", error);
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const setStatusFilterUrl = (status: UserStatus | null) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`/dashboard/admin/users?${params}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-title">{t("title")}</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-ghost">
          <Plus className="h-5 w-5" />
          {t("add")}
        </button>
      </div>

      {/* Filters - inline style */}
      <div className="flex items-center gap-5 py-4 text-base border-b">
        <button
          onClick={() => setStatusFilterUrl(null)}
          className={`hover:text-foreground transition-colors ${!statusFilter ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {t("filter.all")}
          <span className="ml-1.5 text-muted-foreground">({data?.counts.total || 0})</span>
        </button>
        <button
          onClick={() => setStatusFilterUrl("pending")}
          className={`hover:text-foreground transition-colors ${statusFilter === "pending" ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {t("filter.pending")}
          {(data?.counts.pending || 0) > 0 && (
            <span className="ml-1.5 text-orange-500">({data?.counts.pending})</span>
          )}
        </button>
        <button
          onClick={() => setStatusFilterUrl("approved")}
          className={`hover:text-foreground transition-colors ${statusFilter === "approved" ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {t("filter.approved")}
        </button>
        <button
          onClick={() => setStatusFilterUrl("rejected")}
          className={`hover:text-foreground transition-colors ${statusFilter === "rejected" ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {t("filter.rejected")}
        </button>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={tCommon("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-base bg-transparent border-0 border-b border-transparent focus:border-muted-foreground focus:outline-none w-48 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full mt-3">
        <thead>
          <tr className="text-sm text-muted-foreground uppercase tracking-wider border-b">
            <th className="text-left py-3 font-medium">{t("table.name")}</th>
            <th className="text-left py-3 font-medium w-36">{t("table.role")}</th>
            <th className="text-left py-3 font-medium w-28">{t("table.status")}</th>
            <th className="text-left py-3 font-medium w-28">{t("table.created")}</th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </td>
            </tr>
          ) : data?.users.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-muted-foreground text-base">
                {t("table.noData")}
              </td>
            </tr>
          ) : (
            data?.users.map((user) => (
              <tr
                key={user._id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
              >
                {/* Name & Email */}
                <td className="py-4">
                  <div className="text-base font-medium">{user.name}</div>
                  <div className="text-base text-muted-foreground">{user.email}</div>
                </td>

                {/* Role */}
                <td className="py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user._id, e.target.value as UserRole)}
                    disabled={actionLoading === user._id}
                    className="text-base bg-transparent border-0 cursor-pointer hover:text-primary focus:outline-none disabled:opacity-50"
                  >
                    {Object.values(USER_ROLES).map((role) => (
                      <option key={role} value={role}>
                        {tUsers(`roles.${role}`)}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Status */}
                <td className="py-4 text-base">
                  {user.status === "pending" && (
                    <span className="text-orange-500">{t("status.pending")}</span>
                  )}
                  {user.status === "rejected" && (
                    <span className="text-red-500">{t("status.rejected")}</span>
                  )}
                  {user.status === "approved" &&
                    (user.isActive ? (
                      <span className="text-green-600">{t("status.active")}</span>
                    ) : (
                      <span className="text-muted-foreground">{t("status.inactive")}</span>
                    ))}
                </td>

                {/* Date */}
                <td className="py-4 text-base text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString(locale)}
                </td>

                {/* Actions */}
                <td className="py-4">
                  <div className="relative" ref={openMenuId === user._id ? menuRef : null}>
                    {actionLoading === user._id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                          className="p-1.5 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>

                        {openMenuId === user._id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-popover border rounded-lg shadow-lg py-1.5 z-10">
                            {user.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(user._id)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left text-base"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  {t("actions.approve")}
                                </button>
                                <button
                                  onClick={() => handleReject(user._id)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left text-base"
                                >
                                  <UserX className="h-4 w-4" />
                                  {t("actions.reject")}
                                </button>
                                <div className="border-t my-1.5" />
                              </>
                            )}

                            {user.status === "approved" && (
                              <>
                                <button
                                  onClick={() => handleToggleActive(user._id, user.isActive)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left text-base"
                                >
                                  {user.isActive ? (
                                    <>
                                      <X className="h-4 w-4" />
                                      {t("actions.deactivate")}
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      {t("actions.activate")}
                                    </>
                                  )}
                                </button>
                                <div className="border-t my-1.5" />
                              </>
                            )}

                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left text-base"
                            >
                              <Pencil className="h-4 w-4" />
                              {t("actions.edit")}
                            </button>

                            <button
                              onClick={() => handleDelete(user._id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left text-base text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("actions.delete")}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination - minimal */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between py-5 text-base text-muted-foreground">
          <span>
            {data.pagination.total} {t("table.records")}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage - 1).toString());
                router.push(`/dashboard/admin/users?${params}`);
              }}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 hover:bg-muted rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="px-3">
              {currentPage} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage + 1).toString());
                router.push(`/dashboard/admin/users?${params}`);
              }}
              disabled={currentPage >= data.pagination.totalPages}
              className="px-3 py-1.5 hover:bg-muted rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {(showCreateModal || editingUser) && (
        <UserFormModal
          user={editingUser || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSuccess,
}: {
  user?: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50">
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
              <label className="form-label">{t("name")}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 text-base bg-transparent border-b-2 focus:border-foreground focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="form-label">{t("email")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 text-base bg-transparent border-b-2 focus:border-foreground focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="form-label">{isEditing ? t("newPassword") : t("password")}</label>
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
              <label className="form-label">{t("role")}</label>
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
