import { useState, useEffect } from "react";

export interface RoleDef {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
}

export function useBoardRoles(boardId: string) {
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch(`/api/boards/${boardId}/roles`);
        if (res.ok) {
          const data = await res.json();
          setRoles(data.roles);
        } else {
          console.error("Failed to fetch roles");
          setError("Failed to fetch roles");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching roles");
      } finally {
        setLoading(false);
      }
    }

    if (boardId) {
      fetchRoles();
    }
  }, [boardId]);

  return { roles, loading, error };
}
