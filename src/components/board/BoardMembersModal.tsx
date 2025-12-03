"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<BoardRole>(BOARD_ROLES.VIEWER);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "settings">("members");
  const [visibility, setVisibility] = useState<BoardVisibility>(currentVisibility);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMembers();
      setVisibility(currentVisibility);
    }
  }, [isOpen, fetchMembers, currentVisibility]);

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
    setAddLoading(true);
    setAddError("");

    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail, role: addRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Có lỗi xảy ra");
        return;
      }

      setAddEmail("");
      setAddRole(BOARD_ROLES.VIEWER);
      setShowAddForm(false);
      fetchMembers();
    } catch {
      setAddError("Có lỗi xảy ra");
    } finally {
      setAddLoading(false);
    }
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
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Chia sẻ & Thành viên</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        {canEditBoard && (
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "members"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4 inline mr-1.5" />
              Thành viên
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "settings"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4 inline mr-1.5" />
              Cài đặt
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && canEditBoard && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Chế độ hiển thị</h3>
              <div className="space-y-2">
                {Object.entries(BOARD_VISIBILITY).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
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
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {VISIBILITY_ICONS[value]}
                        <span className="font-medium text-sm">
                          {BOARD_VISIBILITY_LABELS[value]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
        {activeTab === "members" && canManageMembers && (
          <div className="p-4 border-b">
            {showAddForm ? (
              <form onSubmit={handleAddMember} className="space-y-3">
                {addError && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded">
                    {addError}
                  </div>
                )}
                <div>
                  <input
                    type="email"
                    placeholder="Email người dùng"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as BoardRole)}
                    className="flex-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 border rounded-md hover:bg-muted text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    {addLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Thêm"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <UserPlus className="h-4 w-4" />
                Thêm thành viên
              </button>
            )}
          </div>
        )}

        {/* Members Tab - Members list */}
        {activeTab === "members" && (
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Chưa có thành viên nào
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {member.user.name}
                          </span>
                          {ROLE_ICONS[member.role]}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {member.user.email}
                        </span>
                      </div>
                    </div>

                    {actionLoading === member._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : member.isOwner ? (
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                        {BOARD_ROLE_LABELS.owner}
                      </span>
                    ) : canManageMembers ? (
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(member._id, e.target.value as BoardRole)
                            }
                            className="appearance-none pr-6 pl-2 py-1 text-xs border rounded bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
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
                          </select>
                          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
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
