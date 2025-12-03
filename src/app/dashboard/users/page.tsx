"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Loader2,
  X,
  Crown,
  Shield,
  User,
  UserCog,
} from "lucide-react";
import { USER_ROLES, type UserRole } from "@/types/user";

interface UserInfo {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  position?: string;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  user: "Người dùng",
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin: <Crown className="h-4 w-4 text-yellow-500" />,
  manager: <Shield className="h-4 w-4 text-blue-500" />,
  staff: <UserCog className="h-4 w-4 text-green-500" />,
  user: <User className="h-4 w-4 text-gray-500" />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  staff: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  const isAdmin = session?.user?.role === USER_ROLES.ADMIN;
  const isManager = session?.user?.role === USER_ROLES.MANAGER;
  const canViewDetails = isAdmin || isManager;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Group by role
  const groupedUsers = {
    admin: filteredUsers.filter((u) => u.role === "admin"),
    manager: filteredUsers.filter((u) => u.role === "manager"),
    staff: filteredUsers.filter((u) => u.role === "staff"),
    user: filteredUsers.filter((u) => u.role === "user"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Nhân sự
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Danh sách nhân viên trong hệ thống ({users.length} người)
          </p>
        </div>
        {isAdmin && (
          <a
            href="/dashboard/admin/users"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Quản lý tài khoản
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, phòng ban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              roleFilter === "all"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tất cả
          </button>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role as UserRole)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                roleFilter === role
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ROLE_ICONS[role as UserRole]}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Không tìm thấy nhân viên nào</p>
        </div>
      ) : roleFilter === "all" ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedUsers).map(
            ([role, roleUsers]) =>
              roleUsers.length > 0 && (
                <div key={role}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    {ROLE_ICONS[role as UserRole]}
                    {ROLE_LABELS[role as UserRole]} ({roleUsers.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {roleUsers.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        onClick={() => canViewDetails && setSelectedUser(user)}
                        canViewDetails={canViewDetails}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      ) : (
        // Flat view when filtered
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onClick={() => canViewDetails && setSelectedUser(user)}
              canViewDetails={canViewDetails}
            />
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

function UserCard({
  user,
  onClick,
  canViewDetails,
}: {
  user: UserInfo;
  onClick: () => void;
  canViewDetails: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg bg-card hover:shadow-md transition-all ${
        canViewDetails ? "cursor-pointer hover:border-primary/50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{user.name}</h3>
            {ROLE_ICONS[user.role]}
          </div>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>

          {/* Role badge */}
          <span
            className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
          >
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </div>

      {/* Additional info */}
      {(user.department || user.position) && (
        <div className="mt-3 pt-3 border-t space-y-1">
          {user.department && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              {user.department}
            </p>
          )}
          {user.position && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" />
              {user.position}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
}: {
  user: UserInfo;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Thông tin nhân viên</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
              >
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>

          {/* Info list */}
          <div className="space-y-4">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            {user.phone && (
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Điện thoại" value={user.phone} />
            )}
            {user.department && (
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Phòng ban" value={user.department} />
            )}
            {user.position && (
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Chức vụ" value={user.position} />
            )}
            <InfoRow
              icon={<Users className="h-4 w-4" />}
              label="Ngày tham gia"
              value={new Date(user.createdAt).toLocaleDateString("vi-VN")}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
