"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Loader2,
  Check,
  X,
  Clock,
  FileText,
} from "lucide-react";

interface Invitation {
  _id: string;
  board: {
    _id: string;
    name: string;
    icon: string;
    description?: string;
  };
  role: string;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

interface PendingInvitationsProps {
  onAccepted?: (boardId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  viewer: "Người xem",
  restricted_editor: "Cộng tác viên (Chỉ việc được giao)",
  restricted_viewer: "Khách (Chỉ việc được giao)",
};

export function PendingInvitations({ onAccepted }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleRespond = async (invitationId: string, action: "accept" | "decline") => {
    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));

        if (action === "accept" && data.boardId && onAccepted) {
          onAccepted(data.boardId);
        }
      }
    } catch (error) {
      console.error("Failed to respond to invitation:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffDays > 0) return `Còn ${diffDays} ngày`;
    if (diffHours > 0) return `Còn ${diffHours} giờ`;
    return "Sắp hết hạn";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Lời mời đang chờ ({invitations.length})</h3>
      </div>

      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation._id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                {invitation.board.icon || <FileText className="h-5 w-5" />}
              </div>
              <div>
                <div className="font-medium">{invitation.board.name}</div>
                <div className="text-sm text-muted-foreground">
                  <span>{invitation.invitedBy.name} mời bạn làm </span>
                  <span className="font-medium">
                    {ROLE_LABELS[invitation.role] || invitation.role}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeRemaining(invitation.expiresAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {actionLoading === invitation._id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <button
                    onClick={() => handleRespond(invitation._id, "decline")}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Từ chối"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleRespond(invitation._id, "accept")}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    title="Chấp nhận"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
