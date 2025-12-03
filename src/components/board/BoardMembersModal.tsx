"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  UserPlus,
  X,
  Crown,
  Shield,
  Pencil,
  Eye,
  Loader2,
  Trash2,
  ChevronDown,
  Globe,
  Lock,
  Building2,
  Settings,
  UserCheck,
  User,
  Search,
  Check,
} from "lucide-react";
import {
  BOARD_ROLES,
  BOARD_ROLE_LABELS,
  BOARD_VISIBILITY,
  BOARD_VISIBILITY_LABELS,
  type BoardRole,
  type BoardVisibility,
} from "@/types/board-member";

interface BoardMember {
  _id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  role: BoardRole;
  addedAt: string;
  isOwner: boolean;
}

interface SystemUser {
  _id: string;
  name: string;
  email: string;
}

interface BoardMembersModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  canManageMembers?: boolean;
  canEditBoard?: boolean;
  currentVisibility?: BoardVisibility;
  onVisibilityChange?: (visibility: BoardVisibility) => void;
}

const ROLE_ICONS: Record<BoardRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4 text-yellow-500" />,
  admin: <Shield className="h-4 w-4 text-blue-500" />,
  editor: <Pencil className="h-4 w-4 text-green-500" />,
  viewer: <Eye className="h-4 w-4 text-gray-500" />,
  restricted_editor: <UserCheck className="h-4 w-4 text-orange-500" />,
  restricted_viewer: <User className="h-4 w-4 text-gray-400" />,
};

const VISIBILITY_ICONS: Record<BoardVisibility, React.ReactNode> = {
  private: <Lock className="h-4 w-4" />,
  workspace: <Building2 className="h-4 w-4" />,
  public: <Globe className="h-4 w-4" />,
};

const VISIBILITY_DESCRIPTIONS: Record<BoardVisibility, string> = {
  private: "Chỉ thành viên được mời mới có thể truy cập",
  workspace: "Tất cả người dùng trong hệ thống có thể xem",
  public: "Bất kỳ ai có liên kết đều có thể xem",
};

export function BoardMembersModal({
  boardId,
  isOpen,
  onClose,
  canManageMembers = false,
  canEditBoard = false,
  currentVisibility = BOARD_VISIBILITY.PRIVATE,
  onVisibilityChange,
}: BoardMembersModalProps) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addRole, setAddRole] = useState<BoardRole>(BOARD_ROLES.VIEWER);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "settings">("members");
  const [visibility, setVisibility] = useState<BoardVisibility>(currentVisibility);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [canManageMembersState, setCanManageMembersState] = useState(canManageMembers);
  const [canEditBoardState, setCanEditBoardState] = useState(canEditBoard);

  // User selection states
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        if (typeof data.canManageMembers === 'boolean') {
          setCanManageMembersState(data.canManageMembers);
        }
        if (typeof data.canEditBoard === 'boolean') {
          setCanEditBoardState(data.canEditBoard);
        }
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const fetchAllUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMembers();
      fetchAllUsers();
      setVisibility(currentVisibility);
      setCanManageMembersState(canManageMembers);
      setCanEditBoardState(canEditBoard);
    }
  }, [isOpen, fetchMembers, fetchAllUsers, currentVisibility, canManageMembers, canEditBoard]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter users that are not already members
  const availableUsers = allUsers.filter(
    (user) => !members.some((member) => member.userId === user._id)
  );

  // Filter by search query
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVisibilityChange = async (newVisibility: BoardVisibility) => {
    if (!onVisibilityChange) return;
    setVisibilityLoading(true);
    try {
      onVisibilityChange(newVisibility);
      setVisibility(newVisibility);
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setAddError("Vui lòng chọn người dùng");
      return;
    }

    setAddLoading(true);
    setAddError("");

    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedUser.email, role: addRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Có lỗi xảy ra");
        return;
      }

      setSelectedUser(null);
      setSearchQuery("");
      setAddRole(BOARD_ROLES.VIEWER);
      setShowAddForm(false);
      fetchMembers();
    } catch {
      setAddError("Có lỗi xảy ra");
    } finally {
      setAddLoading(false);
    }
  };

  const handleSelectUser = (user: SystemUser) => {
    setSelectedUser(user);
    setSearchQuery("");
    setShowUserDropdown(false);
    setAddError("");
  };

  const handleUpdateRole = async (memberId: string, newRole: BoardRole) => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/boards/${boardId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/boards/${boardId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Chia sẻ & Thành viên</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        {canEditBoardState && (
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 px-5 py-3.5 text-base font-medium transition-colors ${
                activeTab === "members"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Thành viên
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-5 py-3.5 text-base font-medium transition-colors ${
                activeTab === "settings"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-5 w-5 inline mr-2" />
              Cài đặt
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && canEditBoardState && (
          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-base font-medium mb-4">Chế độ hiển thị</h3>
              <div className="space-y-3">
                {Object.entries(BOARD_VISIBILITY).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      visibility === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={visibility === value}
                      onChange={() => handleVisibilityChange(value)}
                      disabled={visibilityLoading}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {VISIBILITY_ICONS[value]}
                        <span className="font-medium text-base">
                          {BOARD_VISIBILITY_LABELS[value]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {VISIBILITY_DESCRIPTIONS[value]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Members Tab - Add member form */}
        {activeTab === "members" && canManageMembersState && (
          <div className="p-5 border-b">
            {showAddForm ? (
              <form onSubmit={handleAddMember} className="space-y-4">
                {addError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-base rounded-lg">
                    {addError}
                  </div>
                )}

                {/* User selector */}
                <div className="relative" ref={dropdownRef}>
                  {selectedUser ? (
                    <div className="flex items-center justify-between px-4 py-3 border rounded-lg bg-background">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-base font-medium">{selectedUser.name}</div>
                          <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="p-1.5 hover:bg-muted rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm người dùng..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          className="w-full pl-12 pr-4 py-3 border rounded-lg bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </div>

                      {/* User dropdown */}
                      {showUserDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-background border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                          {usersLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="px-4 py-6 text-center text-base text-muted-foreground">
                              {searchQuery
                                ? "Không tìm thấy người dùng"
                                : availableUsers.length === 0
                                  ? "Tất cả người dùng đã là thành viên"
                                  : "Nhập để tìm kiếm..."}
                            </div>
                          ) : (
                            filteredUsers.map((user) => (
                              <button
                                key={user._id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors"
                              >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-medium shrink-0">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-base font-medium truncate">{user.name}</div>
                                  <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as BoardRole)}
                    className="flex-1 px-4 py-3 border rounded-lg bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option value={BOARD_ROLES.VIEWER}>
                      {BOARD_ROLE_LABELS.viewer}
                    </option>
                    <option value={BOARD_ROLES.EDITOR}>
                      {BOARD_ROLE_LABELS.editor}
                    </option>
                    <option value={BOARD_ROLES.ADMIN}>
                      {BOARD_ROLE_LABELS.admin}
                    </option>
                    <option value={BOARD_ROLES.RESTRICTED_EDITOR}>
                      {BOARD_ROLE_LABELS.restricted_editor}
                    </option>
                    <option value={BOARD_ROLES.RESTRICTED_VIEWER}>
                      {BOARD_ROLE_LABELS.restricted_viewer}
                    </option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedUser(null);
                      setSearchQuery("");
                    }}
                    className="px-4 py-3 border rounded-lg hover:bg-muted text-base"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading || !selectedUser}
                    className="px-5 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {addLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Thêm"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-base text-primary hover:underline"
              >
                <UserPlus className="h-5 w-5" />
                Thêm thành viên
              </button>
            )}
          </div>
        )}

        {/* Members Tab - Members list */}
        {activeTab === "members" && (
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-base">
                Chưa có thành viên nào
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-base">
                            {member.user.name}
                          </span>
                          {ROLE_ICONS[member.role]}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {member.user.email}
                        </span>
                      </div>
                    </div>

                    {actionLoading === member._id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : member.isOwner ? (
                      <span className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-lg">
                        {BOARD_ROLE_LABELS.owner}
                      </span>
                    ) : canManageMembersState ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(member._id, e.target.value as BoardRole)
                            }
                            className="appearance-none pr-7 pl-3 py-2 text-sm border rounded-lg bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/30"
                          >
                            <option value={BOARD_ROLES.VIEWER}>
                              {BOARD_ROLE_LABELS.viewer}
                            </option>
                            <option value={BOARD_ROLES.EDITOR}>
                              {BOARD_ROLE_LABELS.editor}
                            </option>
                            <option value={BOARD_ROLES.ADMIN}>
                              {BOARD_ROLE_LABELS.admin}
                            </option>
                            <option value={BOARD_ROLES.RESTRICTED_EDITOR}>
                              {BOARD_ROLE_LABELS.restricted_editor}
                            </option>
                            <option value={BOARD_ROLES.RESTRICTED_VIEWER}>
                              {BOARD_ROLE_LABELS.restricted_viewer}
                            </option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-lg">
                        {BOARD_ROLE_LABELS[member.role]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
