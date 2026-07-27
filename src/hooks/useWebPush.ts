import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getFirebaseIdToken } from "@/lib/firebase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function useWebPush() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
    if (ok) {
      navigator.serviceWorker.getRegistration("/sw.js").then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!user || !supported) return;
    if (!VAPID_PUBLIC_KEY) {
      throw new Error("Web Push not configured yet. Ask the app owner to add a VAPID key.");
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;
      const reg =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const token = await getFirebaseIdToken();
      await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/profile/push-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        }),
      });
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }, [user, supported]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const token = await getFirebaseIdToken();
        await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/profile/push-subscription`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, []);

  return { supported, permission, subscribed, busy, subscribe, unsubscribe, configured: !!VAPID_PUBLIC_KEY };
}
