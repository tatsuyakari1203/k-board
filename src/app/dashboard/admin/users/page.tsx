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

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  user: "Người dùng",
};

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const reason = prompt("Lý do từ chối (không bắt buộc):");
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
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
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
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Nhân sự</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      {/* Filters - inline style */}
      <div className="flex items-center gap-4 py-3 text-sm border-b">
        <button
          onClick={() => setStatusFilterUrl(null)}
          className={`hover:text-foreground transition-colors ${!statusFilter ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          Tất cả
          <span className="ml-1 text-muted-foreground">({data?.counts.total || 0})</span>
        </button>
        <button
          onClick={() => setStatusFilterUrl("pending")}
          className={`hover:text-foreground transition-colors ${statusFilter === "pending" ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          Chờ duyệt
          {(data?.counts.pending || 0) > 0 && (
            <span className="ml-1 text-orange-500">({data?.counts.pending})</span>
          )}
        </button>
        <button
          onClick={() => setStatusFilterUrl("approved")}
          className={`hover:text-foreground transition-colors ${statusFilter === "approved" ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          Đã duyệt
        </button>
        <button
          onClick={() => setStatusFilterUrl("rejected")}
          className={`hover:text-foreground transition-colors ${statusFilter === "rejected" ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          Từ chối
        </button>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-3 py-1 text-sm bg-transparent border-0 border-b border-transparent focus:border-muted-foreground focus:outline-none w-40 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full mt-2">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b">
            <th className="text-left py-2 font-medium">Tên</th>
            <th className="text-left py-2 font-medium w-32">Vai trò</th>
            <th className="text-left py-2 font-medium w-24">Trạng thái</th>
            <th className="text-left py-2 font-medium w-24">Ngày tạo</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </td>
            </tr>
          ) : data?.users.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            data?.users.map((user) => (
              <tr
                key={user._id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
              >
                {/* Name & Email */}
                <td className="py-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </td>

                {/* Role */}
                <td className="py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user._id, e.target.value as UserRole)}
                    disabled={actionLoading === user._id}
                    className="text-sm bg-transparent border-0 cursor-pointer hover:text-primary focus:outline-none disabled:opacity-50"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>

                {/* Status */}
                <td className="py-3 text-sm">
                  {user.status === "pending" && (
                    <span className="text-orange-500">Chờ duyệt</span>
                  )}
                  {user.status === "rejected" && (
                    <span className="text-red-500">Từ chối</span>
                  )}
                  {user.status === "approved" && (
                    user.isActive ? (
                      <span className="text-green-600">Hoạt động</span>
                    ) : (
                      <span className="text-muted-foreground">Vô hiệu</span>
                    )
                  )}
                </td>

                {/* Date */}
                <td className="py-3 text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </td>

                {/* Actions */}
                <td className="py-3">
                  <div className="relative" ref={openMenuId === user._id ? menuRef : null}>
                    {actionLoading === user._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                          className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuId === user._id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-popover border rounded-md shadow-md py-1 z-10 text-sm">
                            {user.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(user._id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Phê duyệt
                                </button>
                                <button
                                  onClick={() => handleReject(user._id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  Từ chối
                                </button>
                                <div className="border-t my-1" />
                              </>
                            )}

                            {user.status === "approved" && (
                              <>
                                <button
                                  onClick={() => handleToggleActive(user._id, user.isActive)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left"
                                >
                                  {user.isActive ? (
                                    <>
                                      <X className="h-3.5 w-3.5" />
                                      Vô hiệu hóa
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Kích hoạt
                                    </>
                                  )}
                                </button>
                                <div className="border-t my-1" />
                              </>
                            )}

                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Chỉnh sửa
                            </button>

                            <button
                              onClick={() => handleDelete(user._id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xóa
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
        <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
          <span>{data.pagination.total} người dùng</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage - 1).toString());
                router.push(`/dashboard/admin/users?${params}`);
              }}
              disabled={currentPage <= 1}
              className="px-2 py-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="px-2">{currentPage} / {data.pagination.totalPages}</span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage + 1).toString());
                router.push(`/dashboard/admin/users?${params}`);
              }}
              disabled={currentPage >= data.pagination.totalPages}
              className="px-2 py-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
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
            ...(formData.password && { password: formData.password })
          }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      onSuccess();
    } catch {
      setError("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50">
      <div className="bg-background w-full max-w-md mx-4 rounded-lg shadow-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">
            {isEditing ? "Chỉnh sửa" : "Thêm nhân viên"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Họ và tên</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-transparent border-b focus:border-foreground focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 bg-transparent border-b focus:border-foreground focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {isEditing ? "Mật khẩu mới" : "Mật khẩu"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEditing}
                minLength={6}
                placeholder={isEditing ? "Để trống nếu không đổi" : ""}
                className="w-full px-3 py-2 bg-transparent border-b focus:border-foreground focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-transparent border-b focus:border-foreground focus:outline-none cursor-pointer"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-sm hover:bg-muted rounded transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : isEditing ? "Lưu" : "Tạo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
