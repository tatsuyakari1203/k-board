"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Loader2,
  User,
  Plus,
  Trash2,
  Edit,
  UserPlus,
  UserMinus,
  RefreshCw,
} from "lucide-react";

interface ActivityItem {
  _id: string;
  type: string;
  description: string;
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
  targetUser?: {
    _id: string;
    name: string;
  } | null;
  taskId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface BoardActivityFeedProps {
  boardId: string;
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  "task.created": <Plus className="h-3.5 w-3.5 text-green-500" />,
  "task.updated": <Edit className="h-3.5 w-3.5 text-blue-500" />,
  "task.deleted": <Trash2 className="h-3.5 w-3.5 text-red-500" />,
  "task.moved": <RefreshCw className="h-3.5 w-3.5 text-purple-500" />,
  "member.joined": <UserPlus className="h-3.5 w-3.5 text-green-500" />,
  "member.left": <UserMinus className="h-3.5 w-3.5 text-orange-500" />,
  "member.added": <UserPlus className="h-3.5 w-3.5 text-blue-500" />,
  "member.removed": <UserMinus className="h-3.5 w-3.5 text-red-500" />,
  "member.role_changed": <User className="h-3.5 w-3.5 text-purple-500" />,
  "board.updated": <Edit className="h-3.5 w-3.5 text-blue-500" />,
};

export function BoardActivityFeed({ boardId, isOpen = true, onClose, inline = false }: BoardActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (before?: string) => {
    if (before) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({ limit: "30" });
      if (before) params.set("before", before);

      const res = await fetch(`/api/boards/${boardId}/activities?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (before) {
          setActivities((prev) => [...prev, ...data.activities]);
        } else {
          setActivities(data.activities);
        }
        setHasMore(data.activities.length === 30);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen, fetchActivities]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const loadMore = () => {
    if (activities.length > 0 && hasMore) {
      const lastActivity = activities[activities.length - 1];
      fetchActivities(lastActivity.createdAt);
    }
  };

  if (!isOpen) return null;

  // Inline version (for embedding in other components)
  if (inline) {
    return (
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Chưa có hoạt động nào
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {activity.user?.image ? (
                      <img
                        src={activity.user.image}
                        alt={activity.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {activity.user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {ACTIVITY_ICONS[activity.type] || (
                      <Activity className="h-3.5 w-3.5 text-gray-500" />
                    )}
                    <span className="text-sm">
                      <span className="font-medium">
                        {activity.user?.name || "Unknown"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {activity.description}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  ) : (
                    "Xem thêm"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Modal version
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có hoạt động nào
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity._id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {activity.user?.image ? (
                        <img
                          src={activity.user.image}
                          alt={activity.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-xs font-medium">
                          {activity.user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {ACTIVITY_ICONS[activity.type] || (
                        <Activity className="h-3.5 w-3.5 text-gray-500" />
                      )}
                      <span className="text-sm">
                        <span className="font-medium">
                          {activity.user?.name || "Unknown"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {activity.description}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : (
                      "Xem thêm"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
