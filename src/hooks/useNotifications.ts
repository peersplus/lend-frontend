import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getFirebaseIdToken } from "@/lib/firebase";

export type Notification = {
  id: string;
  recipient_id: string;
  request_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/notifications`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || "Unable to load notifications");
      setItems((body?.data as Notification[]) ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [user, load]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!unread.length) return;
    const token = await getFirebaseIdToken();
    await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/notifications/mark-all-read`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
  }, [items, user]);

  return { items, unreadCount, loading, reload: load, markAllRead };
}
