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
  Lock,
  Building2,
  Settings,
  UserCheck,
  User,
  Search,
  Send,
  Mail,
  Clock,
  ArrowRightLeft,
  Activity,
} from "lucide-react";
import {
  // BOARD_ROLES, // Deprecated usage
  BOARD_VISIBILITY,
  type BoardRole,
  type BoardVisibility,
} from "@/types/board-member";
import { BoardActivityFeed } from "./BoardActivityFeed";
import { useTranslations } from "next-intl";
import { useBoardRoles } from "@/hooks/use-board-roles";

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

interface Invitation {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  role: BoardRole;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
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
  onVisibilityChange?: (visibility: BoardVisibility) => void | Promise<void>;
  isOwner?: boolean;
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
};

export function BoardMembersModal({
  boardId,
  isOpen,
  onClose,
  canManageMembers = false,
  canEditBoard = false,
  currentVisibility = BOARD_VISIBILITY.PRIVATE,
  onVisibilityChange,
  isOwner = false,
}: BoardMembersModalProps) {
  const t = useTranslations("BoardMembers");
  const tRoles = useTranslations("BoardRoles");
  const tVisibility = useTranslations("BoardVisibility");

  const [members, setMembers] = useState<BoardMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<"direct" | "invite">("direct");
  const { roles: availableRoles, loading: rolesLoading } = useBoardRoles(boardId);
  const [addRole, setAddRole] = useState<string>("viewer");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "settings" | "activity">("members");
  const [visibility, setVisibility] = useState<BoardVisibility>(currentVisibility);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [canManageMembersState, setCanManageMembersState] = useState(canManageMembers);
  const [isOwnerState, setIsOwnerState] = useState(isOwner);

  // Transfer ownership states
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferTarget, setTransferTarget] = useState<BoardMember | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [canEditBoardState, setCanEditBoardState] = useState(canEditBoard);

  // User selection states
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getRoleLabel = (roleSlug: string) => {
    const roleDef = availableRoles.find((r) => r.slug === roleSlug);
    // Prefer translation for system keys if available
    // We can check if the slug matches standard keys
    if (
      ["owner", "admin", "editor", "viewer", "restricted_editor", "restricted_viewer"].includes(
        roleSlug
      )
    ) {
      return tRoles(roleSlug);
    }
    return roleDef?.name || roleSlug;
  };

  const getRoleIcon = (roleSlug: string) => {
    // Use a default icon for unknown roles
    return ROLE_ICONS[roleSlug as BoardRole] || <User className="h-4 w-4 text-gray-500" />;
  };

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        if (typeof data.canManageMembers === "boolean") {
          setCanManageMembersState(data.canManageMembers);
        }
        if (typeof data.canEditBoard === "boolean") {
          setCanEditBoardState(data.canEditBoard);
        }
        if (typeof data.isOwner === "boolean") {
          setIsOwnerState(data.isOwner);
        }
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/invitations`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
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
      fetchInvitations();
      setVisibility(currentVisibility);
      setCanManageMembersState(canManageMembers);
      setCanEditBoardState(canEditBoard);
      setIsOwnerState(isOwner);
    }
  }, [
    isOpen,
    fetchMembers,
    fetchAllUsers,
    fetchInvitations,
    currentVisibility,
    canManageMembers,
    canEditBoard,
    isOwner,
  ]);

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
    if (!onVisibilityChange || newVisibility === visibility) return;
    setVisibilityLoading(true);
    try {
      await onVisibilityChange(newVisibility);
      setVisibility(newVisibility);
    } catch (error) {
      console.error("Failed to change visibility:", error);
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setAddError(t("add.selectUser"));
      return;
    }

    setAddLoading(true);
    setAddError("");

    try {
      const endpoint =
        addMode === "invite"
          ? `/api/boards/${boardId}/invitations`
          : `/api/boards/${boardId}/members`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
          role: addRole,
          userId: selectedUser._id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || t("error"));
        return;
      }

      setSelectedUser(null);
      setSearchQuery("");
      setSelectedUser(null);
      setSearchQuery("");
      setAddRole("viewer");
      setShowAddForm(false);
      setShowAddForm(false);

      if (addMode === "invite") {
        fetchInvitations();
      } else {
        fetchMembers();
      }
    } catch {
      setAddError(t("error"));
    } finally {
      setAddLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm(t("invitations.cancelConfirm"))) return;

    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/boards/${boardId}/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchInvitations();
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;

    setTransferLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerId: transferTarget.userId }),
      });

      if (res.ok) {
        setShowTransferDialog(false);
        setTransferTarget(null);
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || t("error"));
      }
    } catch (error) {
      console.error("Failed to transfer ownership:", error);
      alert(t("error"));
    } finally {
      setTransferLoading(false);
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
    if (!confirm(t("list.removeConfirm"))) return;

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
            <h2 className="text-xl font-semibold">{t("title")}</h2>
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
              {t("tabs.members")}
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 px-5 py-3.5 text-base font-medium transition-colors ${
                activeTab === "activity"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-5 w-5 inline mr-2" />
              {t("tabs.activity")}
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
              {t("tabs.settings")}
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && canEditBoardState && (
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            <div>
              <h3 className="text-base font-medium mb-4">{t("visibility.title")}</h3>
              <div className="space-y-3">
                {Object.entries(BOARD_VISIBILITY).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      visibility === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    } ${visibilityLoading ? "opacity-50 pointer-events-none" : ""}`}
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
                        <span className="font-medium text-base">{tVisibility(value)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tVisibility(`${value}Desc`)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Transfer Ownership Section - Only for owners */}
            {isOwnerState && (
              <div className="pt-4 border-t">
                <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  {t("transfer.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{t("transfer.desc")}</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members
                    .filter((m) => !m.isOwner)
                    .map((member) => (
                      <button
                        key={member._id}
                        onClick={() => {
                          setTransferTarget(member);
                          setShowTransferDialog(true);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium">{member.user.name}</div>
                            <div className="text-xs text-muted-foreground">{member.user.email}</div>
                          </div>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="flex-1 overflow-y-auto p-5">
            <BoardActivityFeed boardId={boardId} inline />
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

                {/* Add mode toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAddMode("direct")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      addMode === "direct"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    {t("add.direct")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("invite")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      addMode === "invite"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    {t("add.invite")}
                  </button>
                </div>

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
                          placeholder={t("add.searchPlaceholder")}
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
                                ? t("add.noResults")
                                : availableUsers.length === 0
                                  ? t("add.allMembers")
                                  : t("add.searchPlaceholder")}
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
                                  <div className="text-sm text-muted-foreground truncate">
                                    {user.email}
                                  </div>
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
                    disabled={rolesLoading}
                  >
                    {availableRoles.map((role) => (
                      <option key={role.slug} value={role.slug}>
                        {role.name}
                      </option>
                    ))}
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
                    {t("add.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading || !selectedUser}
                    className="px-5 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {addLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : addMode === "invite" ? (
                      t("add.submitInvite")
                    ) : (
                      t("add.submitAdd")
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
                {t("title")}
              </button>
            )}
          </div>
        )}

        {/* Pending Invitations */}
        {activeTab === "members" && canManageMembersState && invitations.length > 0 && (
          <div className="p-5 border-b bg-muted/30">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("invitations.title")} ({invitations.length})
            </h4>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{invitation.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {invitation.user.email} • {getRoleLabel(invitation.role)}
                      </div>
                    </div>
                  </div>
                  {actionLoading === invitation._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <button
                      onClick={() => handleCancelInvitation(invitation._id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600"
                      title={t("add.cancel")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
                {t("list.noMembers")}
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
                          <span className="font-medium text-base">{member.user.name}</span>
                          {getRoleIcon(member.role)}
                        </div>
                        <span className="text-sm text-muted-foreground">{member.user.email}</span>
                      </div>
                    </div>

                    {actionLoading === member._id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : member.isOwner ? (
                      <span className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-lg">
                        {getRoleLabel(member.role)}
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
                            {availableRoles.map((role) => (
                              <option key={role.slug} value={role.slug}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-colors"
                          title={t("list.removeConfirm")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-lg">
                        {tRoles(member.role)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Ownership Confirmation Dialog - keeping inline for simplicity or extract if needed */}
      {showTransferDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
            <h3 className="text-lg font-semibold mb-2">{t("transfer.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("transfer.confirmTransfer", { name: transferTarget?.user.name || "" })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTransferDialog(false);
                  setTransferTarget(null);
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {t("add.cancel")}
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={transferLoading}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                {transferLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
