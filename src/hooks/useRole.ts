import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setRoles([]);
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/user-roles/${user.uid}`, {
          headers: {
            Authorization: `Bearer ${await (await import("@/lib/firebase")).getFirebaseIdToken()}`,
          },
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || "Unable to load roles");
        const role = body?.data?.role || body?.role || "user";
        if (!cancelled) {
          setRoles(role ? [role] : []);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setRoles([]);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return {
    roles,
    ready,
    isSuperadmin: roles.some((role) => role === "superadmin" || role === "super_admin"),
  };
}
