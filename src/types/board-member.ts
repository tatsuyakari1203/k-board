// Board Member Types (shared between client and server)

// Board member roles with permission levels
export type BoardRole = "owner" | "admin" | "editor" | "viewer" | "restricted_editor" | "restricted_viewer";

export const BOARD_ROLES = {
  OWNER: "owner" as BoardRole,           // Full control
  ADMIN: "admin" as BoardRole,           // Manage members, settings
  EDITOR: "editor" as BoardRole,         // Edit all tasks
  VIEWER: "viewer" as BoardRole,         // View all tasks
  RESTRICTED_EDITOR: "restricted_editor" as BoardRole, // Edit assigned tasks only
  RESTRICTED_VIEWER: "restricted_viewer" as BoardRole, // View assigned tasks only
} as const;

// Role display labels
export const BOARD_ROLE_LABELS: Record<BoardRole, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  viewer: "Người xem",
  restricted_editor: "Cộng tác viên (Chỉ việc được giao)",
  restricted_viewer: "Khách (Chỉ việc được giao)",
};

// Permission flags for each role
export interface BoardPermissions {
  canView: boolean;
  viewScope: "all" | "assigned";
  canCreateTasks: boolean;
  canEditTasks: boolean;
  editScope: "all" | "assigned";
  canDeleteTasks: boolean;
  canEditBoard: boolean;
  canManageMembers: boolean;
  canDeleteBoard: boolean;
}

// Permission matrix by role
export const BOARD_ROLE_PERMISSIONS: Record<BoardRole, BoardPermissions> = {
  owner: {
    canView: true,
    viewScope: "all",
    canCreateTasks: true,
    canEditTasks: true,
    editScope: "all",
    canDeleteTasks: true,
    canEditBoard: true,
    canManageMembers: true,
    canDeleteBoard: true,
  },
  admin: {
    canView: true,
    viewScope: "all",
    canCreateTasks: true,
    canEditTasks: true,
    editScope: "all",
    canDeleteTasks: true,
    canEditBoard: true,
    canManageMembers: true,
    canDeleteBoard: false,
  },
  editor: {
    canView: true,
    viewScope: "all",
    canCreateTasks: true,
    canEditTasks: true,
    editScope: "all",
    canDeleteTasks: true,
    canEditBoard: false,
    canManageMembers: false,
    canDeleteBoard: false,
  },
  viewer: {
    canView: true,
    viewScope: "all",
    canCreateTasks: false,
    canEditTasks: false,
    editScope: "all", // Irrelevant but set to all
    canDeleteTasks: false,
    canEditBoard: false,
    canManageMembers: false,
    canDeleteBoard: false,
  },
  restricted_editor: {
    canView: true,
    viewScope: "assigned",
    canCreateTasks: true,
    canEditTasks: true,
    editScope: "assigned",
    canDeleteTasks: false,
    canEditBoard: false,
    canManageMembers: false,
    canDeleteBoard: false,
  },
  restricted_viewer: {
    canView: true,
    viewScope: "assigned",
    canCreateTasks: false,
    canEditTasks: false,
    editScope: "assigned",
    canDeleteTasks: false,
    canEditBoard: false,
    canManageMembers: false,
    canDeleteBoard: false,
  },
};

// Board visibility
export type BoardVisibility = "private" | "workspace" | "public";

export const BOARD_VISIBILITY = {
  PRIVATE: "private" as BoardVisibility,   // Only members can access
  WORKSPACE: "workspace" as BoardVisibility, // All workspace users can view
  PUBLIC: "public" as BoardVisibility,     // Anyone with link can view
} as const;

export const BOARD_VISIBILITY_LABELS: Record<BoardVisibility, string> = {
  private: "Riêng tư",
  workspace: "Workspace",
  public: "Công khai",
};

// Invitation status
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export const INVITATION_STATUS = {
  PENDING: "pending" as InvitationStatus,
  ACCEPTED: "accepted" as InvitationStatus,
  DECLINED: "declined" as InvitationStatus,
  EXPIRED: "expired" as InvitationStatus,
} as const;

// Board member interface for API responses
export interface IBoardMemberResponse {
  _id: string;
  boardId: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  role: BoardRole;
  addedBy?: string;
  addedAt: string;
}

// Helper function to get permissions for a role
export function getPermissionsForRole(role: BoardRole): BoardPermissions {
  return BOARD_ROLE_PERMISSIONS[role];
}

// Helper function to check if a role has a specific permission
export function hasPermission(
  role: BoardRole,
  permission: keyof BoardPermissions
): boolean {
  const value = BOARD_ROLE_PERMISSIONS[role][permission];
  // viewScope and editScope are strings, not booleans
  if (permission === "viewScope" || permission === "editScope") {
    return true; // These are scope identifiers, not boolean permissions
  }
  return value === true;
}
