"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Users,
  FileText,
  Mail,
  Clock,
} from "lucide-react";

interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  } | null;
  performedAt: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ACTION_LABELS: Record<string, string> = {
  "user.created": "Tạo người dùng",
  "user.updated": "Cập nhật người dùng",
  "user.deleted": "Xóa người dùng",
  "user.approved": "Phê duyệt người dùng",
  "user.rejected": "Từ chối người dùng",
  "user.activated": "Kích hoạt người dùng",
  "user.deactivated": "Vô hiệu hóa người dùng",
  "user.role_changed": "Thay đổi vai trò",
  "settings.updated": "Cập nhật cài đặt",
  "board.created": "Tạo board",
  "board.updated": "Cập nhật board",
  "board.deleted": "Xóa board",
  "member.added": "Thêm thành viên",
  "member.removed": "Xóa thành viên",
  "member.role_changed": "Thay đổi vai trò thành viên",
  "ownership.transferred": "Chuyển quyền sở hữu",
  "invitation.sent": "Gửi lời mời",
  "invitation.accepted": "Chấp nhận lời mời",
  "invitation.declined": "Từ chối lời mời",
  "invitation.cancelled": "Hủy lời mời",
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  board: <FileText className="h-4 w-4" />,
  member: <Users className="h-4 w-4" />,
  invitation: <Mail className="h-4 w-4" />,
};

export default function AuditLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState(searchParams.get("action") || "");
  const [entityTypeFilter, setEntityTypeFilter] = useState(searchParams.get("entityType") || "");

  const currentPage = parseInt(searchParams.get("page") || "1");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      if (actionFilter) params.set("action", actionFilter);
      if (entityTypeFilter) params.set("entityType", entityTypeFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, entityTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilters = (action?: string, entityType?: string) => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    params.delete("page");
    router.push(`/dashboard/admin/audit-logs?${params}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDetails = (log: AuditLog) => {
    if (log.previousValue && log.newValue) {
      const changes: string[] = [];
      Object.keys(log.newValue).forEach((key) => {
        const prev = log.previousValue?.[key];
        const next = log.newValue?.[key];
        if (prev !== next) {
          changes.push(`${key}: ${prev} → ${next}`);
        }
      });
      return changes.join(", ");
    }
    if (log.details) {
      return Object.entries(log.details)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Nhật ký hoạt động</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={entityTypeFilter}
          onChange={(e) => {
            setEntityTypeFilter(e.target.value);
            updateFilters(actionFilter, e.target.value);
          }}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          <option value="">Tất cả loại</option>
          <option value="user">Người dùng</option>
          <option value="settings">Cài đặt</option>
          <option value="board">Board</option>
          <option value="member">Thành viên</option>
          <option value="invitation">Lời mời</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            updateFilters(e.target.value, entityTypeFilter);
          }}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          <option value="">Tất cả hành động</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {(actionFilter || entityTypeFilter) && (
          <button
            onClick={() => {
              setActionFilter("");
              setEntityTypeFilter("");
              router.push("/dashboard/admin/audit-logs");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Không có dữ liệu</div>
      ) : (
        <div className="space-y-2">
          {data.logs.map((log) => (
            <div
              key={log._id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {ENTITY_ICONS[log.entityType] || <FileText className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{log.performedBy?.name || "System"}</span>
                  <span className="text-muted-foreground">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  {log.entityName && (
                    <span className="font-medium text-primary">{log.entityName}</span>
                  )}
                </div>

                {formatDetails(log) && (
                  <p className="text-sm text-muted-foreground truncate">{formatDetails(log)}</p>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(log.performedAt)}
                  </span>
                  {log.performedBy?.email && <span>{log.performedBy.email}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between py-5 text-sm text-muted-foreground">
          <span>{data.pagination.total} bản ghi</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage - 1).toString());
                router.push(`/dashboard/admin/audit-logs?${params}`);
              }}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-muted rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3">
              {currentPage} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage + 1).toString());
                router.push(`/dashboard/admin/audit-logs?${params}`);
              }}
              disabled={currentPage >= data.pagination.totalPages}
              className="p-2 hover:bg-muted rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
