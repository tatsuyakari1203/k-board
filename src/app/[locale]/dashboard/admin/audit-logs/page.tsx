"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
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
import { useTranslations, useLocale } from "next-intl";

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

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  board: <FileText className="h-4 w-4" />,
  member: <Users className="h-4 w-4" />,
  invitation: <Mail className="h-4 w-4" />,
};

// Define keys here to iterate over potentially
const ACTION_KEYS = [
  "user.created",
  "user.updated",
  "user.deleted",
  "user.approved",
  "user.rejected",
  "user.activated",
  "user.deactivated",
  "user.role_changed",
  "settings.updated",
  "board.created",
  "board.updated",
  "board.deleted",
  "member.added",
  "member.removed",
  "member.role_changed",
  "ownership.transferred",
  "invitation.sent",
  "invitation.accepted",
  "invitation.declined",
  "invitation.cancelled",
];

export default function AuditLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Admin.auditLogsPage");
  const locale = useLocale();

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
    return new Intl.DateTimeFormat(locale, {
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

  const getActionLabel = (action: string) => {
    // Convert dots to underscores for translation key lookup if needed,
    // but our keys in JSON match the action string with underscores.
    // The incoming action from API uses dots (e.g. "user.created").
    // The JSON keys use underscores (e.g. "user_created").
    const key = action.replace(/\./g, "_");
    // Use a try-catch or just return the key if translation is missing fallback?
    // t() will return the key if missing, so it's safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`actions.${key}` as any);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">{t("title")}</h1>
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
          <option value="">{t("filters.allTypes")}</option>
          {Object.keys(ENTITY_ICONS).map((type) => (
            <option key={type} value={type}>
              {t(`entities.${type}`)}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            updateFilters(e.target.value, entityTypeFilter);
          }}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          <option value="">{t("filters.allActions")}</option>
          {ACTION_KEYS.map((action) => (
            <option key={action} value={action}>
              {getActionLabel(action)}
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
            {t("filters.clear")}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("noData")}</div>
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
                  <span className="text-muted-foreground">{getActionLabel(log.action)}</span>
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
          <span>
            {data.pagination.total} {t("records")}
          </span>
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
