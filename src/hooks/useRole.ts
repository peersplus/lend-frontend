import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setRoles((data ?? []).map((r: { role: string }) => r.role));
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return {
    roles,
    ready,
    isSuperadmin: roles.includes("superadmin"),
  };
}
